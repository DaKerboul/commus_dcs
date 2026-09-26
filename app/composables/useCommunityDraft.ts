import { useDebouncedRefHistory, watchDebounced } from '@vueuse/core'
import type { CommunityDetail, CommunityStreamer } from '#shared/types'

export interface StreamerSuggestionItem {
  streamerId: number
  login: string
  displayName: string
  avatarUrl: string | null
  mentions: number
  evidence: string
}

const STORAGE_PREFIX = 'commus:draft:'

function fromServer(data: Record<string, any>): CommunityDraft {
  // A sensitive value already submitted for review shows instead of the live
  // one, so the field does not appear to revert while it waits.
  const p = data.pendingRevision?.patch ?? {}
  const pick = (key: string) => p[key] ?? data[key] ?? ''

  return {
    name: pick('name'),
    shortDescription: data.shortDescription ?? '',
    description: data.description ?? '',
    objectives: data.objectives ?? '',
    entryConditions: data.entryConditions ?? '',
    sizeText: data.sizeText ?? '',
    founder: data.founder ?? '',
    contact: data.contact ?? '',
    foundedDate: data.foundedDate ?? '',
    communityType: data.communityType ?? 'other',
    sizeCategory: data.sizeCategory ?? 'unknown',
    recruitmentStatus: data.recruitmentStatus ?? 'unknown',
    eventFrequency: data.eventFrequency ?? 'unknown',
    discordUrl: pick('discordUrl'),
    websiteUrl: pick('websiteUrl'),
    youtubeUrl: pick('youtubeUrl'),
    twitchUrl: pick('twitchUrl'),
    instagramUrl: pick('instagramUrl'),
    facebookUrl: pick('facebookUrl'),
    twitterUrl: pick('twitterUrl'),
    otherLinks: ('otherLinks' in p ? p.otherLinks : data.otherLinks) ?? [],
    logoUrl: pick('logoUrl'),
    accentColor: data.accentColor ?? null,
    historicalPeriods: data.historicalPeriods ?? [],
    moduleNames: data.moduleNames ?? [],
    soughtModuleNames: data.soughtModuleNames ?? [],
    experienceNames: data.experienceNames ?? [],
    sections: data.sections ?? [],
    images: ('images' in p ? p.images : data.images) ?? [],
    streamerIds: data.streamerIds ?? [],
  }
}

/**
 * Draft of a community page being edited in place.
 *
 * - survives reloads and navigation (localStorage, keyed to the server version
 *   it was based on, so a stale draft never overwrites newer changes);
 * - undo/redo through a debounced history;
 * - markdown rendered by the server, cached per source text, so the preview is
 *   the exact published output.
 */
export function useCommunityDraft(
  id: number,
  published: Ref<CommunityDetail | null | undefined>,
  /** Every tracked channel, to show a streamer as soon as it is linked in the draft. */
  channels: Ref<Map<number, CommunityStreamer>>,
) {
  const draft = ref<CommunityDraft>(fromServer({}))
  const reference = shallowRef<CommunityDraft>(fromServer({}))
  const pendingFields = ref<string[]>([])
  const streamerSuggestions = ref<StreamerSuggestionItem[]>([])
  const version = ref('')
  const ready = ref(false)
  const loadError = ref('')
  const restored = ref(false)
  const saving = ref(false)
  const saveError = ref('')

  const history = useDebouncedRefHistory(draft, {
    deep: true,
    debounce: 400,
    capacity: 60,
    clone: cloneDraft,
  })

  // ── Persistence ─────────────────────────────────────
  const storageKey = `${STORAGE_PREFIX}${id}`

  function readStored(): { version: string; draft: Partial<CommunityDraft> } | null {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function clearStored() {
    try { localStorage.removeItem(storageKey) } catch { /* storage unavailable */ }
  }

  function persist() {
    if (!ready.value) return
    if (!changed.value.length) return clearStored()
    const payload = { version: version.value, draft: draft.value }
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // Quota: a big gallery can exceed it. Keep the text, which is what hurts
      // to lose; images fall back to the server copy on restore.
      try {
        const { images: _images, ...rest } = draft.value
        localStorage.setItem(storageKey, JSON.stringify({ version: version.value, draft: rest }))
      } catch { /* storage unavailable */ }
    }
  }

  watchDebounced(draft, persist, { deep: true, debounce: 600 })

  // ── Load ─────────────────────────────────────────────
  async function load() {
    const data = await $fetch<Record<string, any>>(`/api/my/communities/${id}`)
    const server = fromServer(data)
    reference.value = server
    pendingFields.value = data.pendingRevision?.fields ?? []
    streamerSuggestions.value = data.streamerSuggestions ?? []
    version.value = `${data.updatedAt}|${data.pendingRevision?.createdAt ?? ''}`

    const stored = readStored()
    restored.value = stored?.version === version.value && !!stored.draft

    // Loading is not an edit: without pausing, the debounced commit would push
    // the previous (empty) draft onto the undo stack.
    history.pause()
    draft.value = cloneDraft(restored.value ? { ...server, ...stored!.draft } : server)
    if (stored && !restored.value) clearStored()
    await nextTick()
    history.resume()
    history.commit()
    history.clear()

    seedHtmlCache(server)
    ready.value = true
  }

  async function init() {
    try {
      await load()
    } catch (error: any) {
      loadError.value = error?.data?.statusMessage
        || 'Impossible de charger cette fiche. Vérifiez que vous la gérez bien.'
    }
  }

  // ── Changes ──────────────────────────────────────────
  const changed = computed(() => ready.value ? changedFields(reference.value, draft.value) : [])
  const changedReviewed = computed(() => changed.value.filter(f => REVIEWED_FIELDS.includes(f)))

  function discard() {
    draft.value = cloneDraft(reference.value)
    clearStored()
  }

  async function publish() {
    if (saving.value || !changed.value.length) return false
    saving.value = true
    saveError.value = ''
    try {
      const body: Record<string, unknown> = { ...draft.value }
      // Unchanged gallery: skip resending megabytes of images for nothing.
      if (sameValue(draft.value.images, reference.value.images)) delete body.images
      await $fetch(`/api/my/communities/${id}`, { method: 'PUT', body })
      clearStored()
      // Reload rather than trust the draft: the server normalises values (URLs,
      // dates) and drops sensitive edits equal to what is already live.
      await load()
      return true
    } catch (error: any) {
      saveError.value = error?.data?.statusMessage || "La publication a échoué. Réessayez."
      return false
    } finally {
      saving.value = false
    }
  }

  // ── Markdown preview ─────────────────────────────────
  const html = reactive(new Map<string, string>())

  function seedHtmlCache(server: CommunityDraft) {
    const pub = published.value
    if (!pub) return
    if (pub.descriptionHtml) html.set(server.description, pub.descriptionHtml)
    if (pub.objectivesHtml) html.set(server.objectives, pub.objectivesHtml)
    server.sections.forEach((s, i) => {
      const rendered = pub.sections?.[i]?.bodyHtml
      if (rendered) html.set(s.body, rendered)
    })
  }

  const markdownSources = computed(() => [
    draft.value.description,
    draft.value.objectives,
    ...draft.value.sections.map(s => s.body),
  ])

  watchDebounced(markdownSources, async (sources) => {
    const missing = [...new Set(sources)].filter(s => s.trim() && !html.has(s))
    await Promise.all(missing.map(async (source) => {
      try {
        const res = await $fetch<{ html: string }>('/api/markdown/preview', { method: 'POST', body: { source } })
        html.set(source, res.html)
      } catch { /* the plain-text fallback shows instead */ }
    }))
  }, { debounce: 350 })

  // ── What CommunityProfile renders ───────────────────
  const preview = computed<CommunityDetail>(() => {
    const d = draft.value
    const orNull = (v: string) => v.trim() || null
    return {
      ...(published.value as CommunityDetail),
      name: d.name || published.value?.name || '',
      shortDescription: orNull(d.shortDescription),
      description: orNull(d.description),
      objectives: orNull(d.objectives),
      descriptionHtml: html.get(d.description) ?? null,
      objectivesHtml: html.get(d.objectives) ?? null,
      sections: d.sections.map(s => ({ title: s.title, body: s.body, bodyHtml: html.get(s.body) ?? '' })),
      entryConditions: orNull(d.entryConditions),
      sizeText: orNull(d.sizeText),
      founder: orNull(d.founder),
      contact: orNull(d.contact),
      communityType: d.communityType,
      sizeCategory: d.sizeCategory,
      recruitmentStatus: d.recruitmentStatus,
      eventFrequency: d.eventFrequency,
      discordUrl: orNull(d.discordUrl),
      websiteUrl: orNull(d.websiteUrl),
      youtubeUrl: orNull(d.youtubeUrl),
      twitchUrl: orNull(d.twitchUrl),
      instagramUrl: orNull(d.instagramUrl),
      facebookUrl: orNull(d.facebookUrl),
      twitterUrl: orNull(d.twitterUrl),
      otherLinks: d.otherLinks.filter(l => l.url.trim()),
      logoUrl: orNull(d.logoUrl),
      accentColor: d.accentColor,
      accentHex: ACCENT_COLORS.find(c => c.value === d.accentColor)?.hex ?? null,
      historicalPeriods: d.historicalPeriods,
      moduleNames: d.moduleNames,
      soughtModuleNames: d.soughtModuleNames,
      experienceNames: d.experienceNames,
      images: d.images,
      // Published summaries carry the usual slot; a freshly linked channel shows without it.
      streamers: d.streamerIds
        .map(sid => published.value?.streamers?.find(x => x.id === sid) ?? channels.value.get(sid))
        .filter((x): x is CommunityStreamer => !!x)
        .sort((a, b) => Number(b.isLiveOnDcs) - Number(a.isLiveOnDcs) || b.dcsMinutes30d - a.dcsMinutes30d),
    }
  })

  return {
    draft,
    preview,
    reference,
    pendingFields,
    streamerSuggestions,
    changed,
    changedReviewed,
    ready,
    loadError,
    restored,
    saving,
    saveError,
    history,
    init,
    discard,
    publish,
  }
}
