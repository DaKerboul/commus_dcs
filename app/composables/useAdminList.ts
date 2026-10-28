import { useDebounceFn } from '@vueuse/core'

export interface AdminPageData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

interface Options {
  /** Unique per list: two lists on the same endpoint must not share state. */
  key: string
  /** Filters this list owns, with their default value. They are mirrored in the URL. */
  defaults?: Record<string, string>
  limit?: number
}

/**
 * A server-driven list: search, filters, sort and page all go to the API, and
 * the current view lives in the URL so a refresh, the back button or a link
 * from a notification lands on the same screen.
 *
 * `lazy` + client-only: the admin is behind a login, so there is nothing to
 * server-render, and navigating must show the page shell with skeletons
 * instead of waiting for the data.
 */
export function useAdminList<T = any, Extra extends object = Record<string, never>>(
  endpoint: string,
  options: Options,
) {
  const route = useRoute()
  const router = useRouter()
  const defaults = options.defaults ?? {}
  const limit = options.limit ?? 25

  const fromUrl = (key: string, fallback: string) => {
    const value = route.query[key]
    return typeof value === 'string' && value ? value : fallback
  }

  const params = reactive<Record<string, string | number>>({
    q: fromUrl('q', ''),
    page: Number.parseInt(fromUrl('page', '1'), 10) || 1,
    ...Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, fromUrl(k, v)])),
  })

  // The input updates at once; the request waits until typing pauses.
  const search = ref(String(params.q))
  const applySearch = useDebounceFn((value: string) => {
    params.q = value.trim()
    params.page = 1
  }, 300)
  watch(search, value => applySearch(value))

  const query = computed(() => {
    const out: Record<string, string | number> = { limit }
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== undefined) out[key] = value
    }
    return out
  })

  const { data, pending, error, refresh } = useFetch<AdminPageData<T> & Extra>(endpoint, {
    key: options.key,
    query,
    lazy: true,
    server: false,
  })

  // Keep the URL in step, touching only the keys this list owns.
  watch(params, () => {
    const next: Record<string, any> = { ...route.query }
    for (const key of ['q', 'page', ...Object.keys(defaults)]) {
      const value = params[key]
      const isDefault = value === '' || (key === 'page' && value === 1) || value === defaults[key]
      if (isDefault) delete next[key]
      else next[key] = String(value)
    }
    router.replace({ query: next })
  })

  function setFilter(key: string, value: string) {
    params[key] = value
    params.page = 1
  }

  function reset() {
    search.value = ''
    params.q = ''
    params.page = 1
    for (const [key, value] of Object.entries(defaults)) params[key] = value
  }

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / limit)))
  const isFiltered = computed(() =>
    !!params.q || Object.entries(defaults).some(([key, value]) => params[key] !== value),
  )

  return { data, items, total, pageCount, limit, pending, error, refresh, params, search, setFilter, reset, isFiltered }
}
