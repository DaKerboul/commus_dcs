/**
 * Seed script: parses the archived VitePress Markdown files and populates
 * the PostgreSQL database via Drizzle ORM.
 *
 * Usage: npm run db:seed
 * Requires DATABASE_URL env var (or defaults to local dev DB).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from './schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://commus:commus@localhost:5432/commus_dcs'
const ARCHIVE_DIR = path.resolve(__dirname, '../../.archive/docs/commus')

// ── Reference data ─────────────────────────────────────

const MODULE_LIST: { name: string; category: string }[] = [
  // Western fixed-wing
  { name: 'A-10A', category: 'western_fixed' },
  { name: 'A-10C', category: 'western_fixed' },
  { name: 'A-4E', category: 'western_fixed' },
  { name: 'AJS-37', category: 'western_fixed' },
  { name: 'AV-8B', category: 'western_fixed' },
  { name: 'C-101', category: 'western_fixed' },
  { name: 'C-130', category: 'western_fixed' },
  { name: 'F-4E', category: 'western_fixed' },
  { name: 'F-5E', category: 'western_fixed' },
  { name: 'F-14', category: 'western_fixed' },
  { name: 'F-15C', category: 'western_fixed' },
  { name: 'F-15E', category: 'western_fixed' },
  { name: 'F-16C', category: 'western_fixed' },
  { name: 'F-86', category: 'western_fixed' },
  { name: 'F/A-18C', category: 'western_fixed' },
  { name: 'JF-17', category: 'western_fixed' },
  { name: 'L-39', category: 'western_fixed' },
  { name: 'M2000-C', category: 'western_fixed' },
  { name: 'MB-339', category: 'western_fixed' },
  { name: 'Mirage F1', category: 'western_fixed' },
  // Eastern fixed-wing
  { name: 'MiG-15', category: 'eastern_fixed' },
  { name: 'MiG-19', category: 'eastern_fixed' },
  { name: 'MiG-21', category: 'eastern_fixed' },
  { name: 'MiG-29', category: 'eastern_fixed' },
  { name: 'Su-25A', category: 'eastern_fixed' },
  { name: 'Su-25T', category: 'eastern_fixed' },
  { name: 'Su-27', category: 'eastern_fixed' },
  { name: 'Su-33', category: 'eastern_fixed' },
  // Helicopters
  { name: 'AH-64D', category: 'helicopter' },
  { name: 'Ka-50', category: 'helicopter' },
  { name: 'Mi-24', category: 'helicopter' },
  { name: 'Mi-8', category: 'helicopter' },
  { name: 'SA-342', category: 'helicopter' },
  { name: 'UH-1', category: 'helicopter' },
  // WW2
  { name: 'BF-109', category: 'ww2' },
  { name: 'FW-190', category: 'ww2' },
  { name: 'I-16', category: 'ww2' },
  { name: 'Mosquito', category: 'ww2' },
  { name: 'P-47D', category: 'ww2' },
  { name: 'P-51D', category: 'ww2' },
  { name: 'Spitfire', category: 'ww2' },
  // Other
  { name: 'Combined Arms', category: 'other' },
  { name: 'Flaming Cliffs', category: 'other' },
]

const EXPERIENCE_LIST: { name: string; slug: string }[] = [
  { name: 'Aerobatics', slug: 'aerobatics' },
  { name: 'Campagnes Dynamiques (DSMC/Liberation)', slug: 'campagnes-dynamiques' },
  { name: 'Communauté dédiée aux Débutants', slug: 'debutants' },
  { name: 'Communauté dédiée aux confirmés/pilotes aguerris', slug: 'confirmes' },
  { name: 'Compétitions Inter-Communautaires', slug: 'competitions-inter' },
  { name: 'Entraînements pour Inscrits', slug: 'entrainements-inscrits' },
  { name: 'Entraînements pour Public', slug: 'entrainements-public' },
  { name: 'Escadron Multi-Branches', slug: 'multi-branches' },
  { name: 'Formations à la Phraséo/Communication (SRS)', slug: 'formations-srs' },
  { name: 'Meetings Aériens Virtuels', slug: 'meetings-aeriens' },
  { name: 'Missions Arcade/Fun', slug: 'missions-arcade' },
  { name: 'Missions MILSIM Lite', slug: 'milsim-lite' },
  { name: 'Missions MILSIM++', slug: 'milsim-plus' },
  { name: 'Présence Tuteurs pour Modules', slug: 'tuteurs' },
  { name: "Présence d'AWACS Humains (Avec/Sans LotATC)", slug: 'awacs-humains' },
  { name: "Présence d'un Serveur Dédié 24/7", slug: 'serveur-24-7' },
  { name: "Présence d'un Serveur Dédié à la demande", slug: 'serveur-a-la-demande' },
  { name: 'Rôle : ANTISHIP', slug: 'role-antiship' },
  { name: 'Rôle : CAP', slug: 'role-cap' },
  { name: 'Rôle : CAS', slug: 'role-cas' },
  { name: 'Rôle : SEAD', slug: 'role-sead' },
  { name: 'Rôle : STRIKE', slug: 'role-strike' },
  { name: 'Rôle : RECON', slug: 'role-recon' },
  { name: 'Tournois (Dogfight/BVR/etc)', slug: 'tournois' },
  { name: 'Événements Inter-Communautaires', slug: 'evenements-inter' },
]

// ── Parsing helpers ────────────────────────────────────

function extractFrontmatter(content: string): { title: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return { title: '' }
  const titleMatch = match[1]!.match(/title:\s*(.+)/)
  return { title: titleMatch ? titleMatch[1]!.trim() : '' }
}

function extractFirstH1(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1]!.trim() : ''
}

function extractDescription(content: string): string {
  // Look for "Présentation du groupe" or "Présentation de la communauté" section
  const patterns = [
    /##\s+Présentation\s+du\s+groupe\s*\n([\s\S]*?)(?=\n##\s|$)/i,
    /##\s+Présentation\s+de\s+la\s+communaut[ée]\s*\n([\s\S]*?)(?=\n##\s|$)/i,
    /##\s+Description\s*\n([\s\S]*?)(?=\n##\s|$)/i,
    /##\s+Présentation\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  ]
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      return match[1]!.trim().replace(/<[^>]+>/g, '').trim()
    }
  }
  return ''
}

function extractObjectives(content: string): string {
  const match = content.match(/##\s+Objectifs?\s+(?:de\s+l['']escadron|du\s+[Gg]roupe)\s*\n([\s\S]*?)(?=\n##\s|$)/i)
  if (match) return match[1]!.trim().replace(/<[^>]+>/g, '').trim()
  return ''
}

function extractInfoField(content: string, fieldName: string): string {
  // Match "- **FieldName** : value" pattern
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`-\\s*\\*\\*${escaped}\\*\\*\\s*:\\s*(.+?)(?=\\n-\\s*\\*\\*|\\n\\n|\\n##|$)`, 'is')
  const match = content.match(pattern)
  if (!match) return ''
  return match[1]!.trim()
}

function extractMultiLineField(content: string, fieldName: string): string[] {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`-\\s*\\*\\*${escaped}\\*\\*\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n-\\s*\\*\\*[A-Z]|\\n\\n##|$)`, 'is')
  const match = content.match(pattern)
  if (!match) return []
  return match[1]!
    .split('\n')
    .map(l => l.replace(/^\s*-\s*/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean)
}

function extractLinks(content: string): { discord?: string; website?: string; youtube?: string; instagram?: string; facebook?: string; twitch?: string; twitter?: string } {
  const links: any = {}
  // Discord
  const discordMatch = content.match(/https?:\/\/discord\.gg\/[\w-]+/i) || content.match(/https?:\/\/discord\.com\/invite\/[\w-]+/i)
  if (discordMatch) links.discord = discordMatch[0]
  // Website — from "Accéder au site" links or Lien Principal
  const siteMatch = content.match(/\[.*?(?:site|Site).*?\]\((https?:\/\/(?!discord)[^\s)]+)\)/)
  if (siteMatch) links.website = siteMatch[1]
  // YouTube
  const ytMatch = content.match(/https?:\/\/(?:www\.)?youtube\.com\/[\w@/-]+/i) || content.match(/https?:\/\/youtu\.be\/[\w-]+/i)
  if (ytMatch) links.youtube = ytMatch[0]
  // Instagram
  const igMatch = content.match(/https?:\/\/(?:www\.)?instagram\.com\/[\w.-]+/i)
  if (igMatch) links.instagram = igMatch[0]
  // Facebook
  const fbMatch = content.match(/https?:\/\/(?:www\.)?facebook\.com\/[\w.-]+/i)
  if (fbMatch) links.facebook = fbMatch[0]
  // Twitch
  const twMatch = content.match(/https?:\/\/(?:www\.)?twitch\.tv\/[\w.-]+/i)
  if (twMatch) links.twitch = twMatch[0]
  // Twitter
  const xMatch = content.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[\w.-]+/i)
  if (xMatch) links.twitter = xMatch[0]

  return links
}

function extractLogoUrl(content: string, slug: string): string | null {
  const imgMatch = content.match(/<img\s+src="([^"]*commus_img[^"]*)"/)
  if (imgMatch) return imgMatch[1]!
  return null
}

function extractImages(content: string): string[] {
  const imgs: string[] = []
  const pattern = /<img\s+src="([^"]*)"[^>]*>/g
  let match
  let first = true
  while ((match = pattern.exec(content)) !== null) {
    // Skip the first image (usually the logo)
    if (first) { first = false; continue }
    if (match[1]!.includes('commus_img')) {
      imgs.push(match[1]!)
    }
  }
  return imgs
}

function mapSizeCategory(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('+300') || t.includes('hub')) return 'hub_300_plus'
  if (t.includes('+150') || t.includes('très grande')) return 'very_large_150_plus'
  if (t.includes('+50') || (t.includes('grande') && !t.includes('très'))) return 'large_50_plus'
  if (t.includes('+30') || (t.includes('moyenne') && !t.includes('<30') && !t.includes('< 30'))) return 'medium_30_plus'
  if (t.includes('<30') || t.includes('< 30') || t.includes('petite')) return 'medium_under_30'
  return 'unknown'
}

function mapCommunityType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('semi-ouvert') || t.includes('semi ouvert')) return 'semi_open_squadron'
  if (t.includes('fermé') || t.includes('ferme')) return 'closed_squadron'
  if (t.includes('sans but') || t.includes('communauté') || t.includes('ouverte')) return 'open_community'
  if (t.includes('événementiel') || t.includes('evenementiel')) return 'event_only'
  if (t.includes('esport')) return 'esport_team'
  return 'other'
}

function mapRecruitment(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('oui') || t.includes('ouvert')) return 'open'
  if (t.includes('non') || t.includes('fermé') || t.includes('ferme')) return 'closed'
  if (t.includes('aucun')) return 'none'
  return 'unknown'
}

function mapEventFrequency(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('très actif') || t.includes('3 par semaine')) return 'very_active'
  if (t.includes('très fréquent') || (t.includes('+1') && t.includes('semaine')) || t.includes("+ d'1 par semaine") || t.includes('plus d\'1')) return 'very_frequent'
  if (t.includes('hebdomadaire') || t.includes('1 chaque semaine') || t.includes('chaque semaine')) return 'weekly'
  if (t.includes('bi-hebdomadaire') || t.includes('2 semaines') || t.includes('bimensuel')) return 'biweekly'
  if (t.includes('mensuel') || t.includes('1 par mois')) return 'monthly'
  if (t.includes('occasionnel') || t.includes('< 1') || t.includes('irrégulier')) return 'occasional'
  return 'unknown'
}

function mapPeriods(content: string): string[] {
  const periods: string[] = []
  const periodsBody = extractInfoField(content, 'Période Historique') + '\n' +
    extractMultiLineField(content, 'Période Historique').join('\n')
  const combinedText = periodsBody.toLowerCase()

  if (combinedText.includes('ww2') || combinedText.includes('1940')) periods.push('ww2')
  if (combinedText.includes('early') && combinedText.includes('1950')) periods.push('cold_war_early')
  if (combinedText.includes('mid') && (combinedText.includes('1960') || combinedText.includes('1970'))) periods.push('cold_war_mid')
  if (combinedText.includes('late') && (combinedText.includes('1970') || combinedText.includes('1980'))) periods.push('cold_war_late')
  if (combinedText.includes('gulf') || combinedText.includes('1990') || combinedText.includes('golfe')) periods.push('gulf_war')
  if (combinedText.includes('début moderne') || combinedText.includes('2000')) periods.push('early_modern')
  if (combinedText.includes('post moderne') || combinedText.includes('2010')) periods.push('post_modern')
  if (combinedText.includes('aucune')) periods.push('none')

  return periods.length ? periods : ['none']
}

function normalizeModuleName(raw: string): string | null {
  const t = raw.trim()
    .replace(/[,;]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Direct matches (case-insensitive)
  const nameMap: Record<string, string> = {
    'a-10a': 'A-10A', 'a-10c': 'A-10C', 'a-10cii': 'A-10C', 'a-10c ii': 'A-10C',
    'a-4e': 'A-4E', 'a4e': 'A-4E',
    'ajs-37': 'AJS-37', 'ajs37': 'AJS-37', 'viggen': 'AJS-37',
    'av-8b': 'AV-8B', 'av8b': 'AV-8B', 'harrier': 'AV-8B',
    'c-101': 'C-101',
    'c-130': 'C-130', 'hercules': 'C-130',
    'f-4e': 'F-4E', 'f-4': 'F-4E', 'phantom': 'F-4E', 'f4e': 'F-4E',
    'f-5e': 'F-5E', 'f-5': 'F-5E', 'f5': 'F-5E', 'f5e': 'F-5E',
    'f-14': 'F-14', 'f-14b': 'F-14', 'f14': 'F-14', 'tomcat': 'F-14',
    'f-15c': 'F-15C', 'f15c': 'F-15C',
    'f-15e': 'F-15E', 'f15e': 'F-15E', 'strike eagle': 'F-15E',
    'f-16c': 'F-16C', 'f-16': 'F-16C', 'f16': 'F-16C', 'f16c': 'F-16C', 'viper': 'F-16C',
    'f-86': 'F-86', 'f86': 'F-86', 'sabre': 'F-86',
    'f/a-18c': 'F/A-18C', 'fa-18c': 'F/A-18C', 'f/a-18': 'F/A-18C', 'fa-18': 'F/A-18C', 'f18': 'F/A-18C', 'hornet': 'F/A-18C',
    'jf-17': 'JF-17', 'jf17': 'JF-17', 'jeff': 'JF-17',
    'l-39': 'L-39', 'l39': 'L-39',
    'm2000-c': 'M2000-C', 'm-2000c': 'M2000-C', 'm2000c': 'M2000-C', 'mirage 2000': 'M2000-C', 'mirage 2000c': 'M2000-C', 'm-2000': 'M2000-C',
    'mb-339': 'MB-339', 'mb339': 'MB-339',
    'mirage f1': 'Mirage F1', 'mirage f-1': 'Mirage F1', 'f1': 'Mirage F1',
    'mig-15': 'MiG-15', 'mig15': 'MiG-15',
    'mig-19': 'MiG-19', 'mig19': 'MiG-19',
    'mig-21': 'MiG-21', 'mig21': 'MiG-21',
    'mig-29': 'MiG-29', 'mig29': 'MiG-29',
    'su-25a': 'Su-25A', 'su25a': 'Su-25A',
    'su-25t': 'Su-25T', 'su25t': 'Su-25T', 'su-25': 'Su-25T',
    'su-27': 'Su-27', 'su27': 'Su-27', 'j-11a': 'Su-27',
    'su-33': 'Su-33', 'su33': 'Su-33',
    'ah-64d': 'AH-64D', 'ah64': 'AH-64D', 'apache': 'AH-64D', 'ah-64': 'AH-64D',
    'ka-50': 'Ka-50', 'ka50': 'Ka-50', 'black shark': 'Ka-50',
    'mi-24': 'Mi-24', 'mi-24p': 'Mi-24', 'mi24': 'Mi-24', 'hind': 'Mi-24',
    'mi-8': 'Mi-8', 'mi8': 'Mi-8', 'mi-8mtv2': 'Mi-8',
    'sa-342': 'SA-342', 'sa342': 'SA-342', 'gazelle': 'SA-342',
    'uh-1': 'UH-1', 'uh-1h': 'UH-1', 'uh1': 'UH-1', 'huey': 'UH-1',
    'bf-109': 'BF-109', 'bf109': 'BF-109',
    'fw-190': 'FW-190', 'fw190': 'FW-190',
    'i-16': 'I-16',
    'mosquito': 'Mosquito',
    'p-47d': 'P-47D', 'p-47': 'P-47D', 'p47': 'P-47D',
    'p-51d': 'P-51D', 'p-51': 'P-51D', 'p51': 'P-51D', 'mustang': 'P-51D',
    'spitfire': 'Spitfire',
    'combined arms': 'Combined Arms', 'ca': 'Combined Arms',
    'flaming cliffs': 'Flaming Cliffs', 'fc3': 'Flaming Cliffs', 'fc': 'Flaming Cliffs',
  }

  const lower = t.toLowerCase()
  if (nameMap[lower]) return nameMap[lower]

  // Try partial match
  for (const [key, val] of Object.entries(nameMap)) {
    if (lower.includes(key) && key.length > 2) return val
  }

  return null
}

function extractModules(content: string): string[] {
  const inlineField = extractInfoField(content, 'Modules') ||
    extractInfoField(content, 'Liste détaillée des Modules') ||
    extractInfoField(content, 'Modules DCS Utilisés')

  const multiLine = extractMultiLineField(content, 'Modules') ||
    extractMultiLineField(content, 'Liste détaillée des Modules') ||
    extractMultiLineField(content, 'Modules DCS Utilisés')

  const rawText = inlineField + '\n' + multiLine.join('\n')

  // Check for "Tous les Modules"
  if (rawText.match(/tous\s+les\s+modules?\s+avions?/i)) {
    return MODULE_LIST.filter(m => m.category !== 'helicopter' && m.category !== 'other').map(m => m.name)
  }

  // Split by common separators and normalize
  const names = new Set<string>()
  const parts = rawText.split(/[,;\n]/)
  for (const part of parts) {
    const cleaned = part.replace(/\*\*/g, '').replace(/<[^>]+>/g, '').trim()
    if (!cleaned) continue
    const normalized = normalizeModuleName(cleaned)
    if (normalized) names.add(normalized)
  }

  return [...names]
}

function extractExperiences(content: string): string[] {
  const multiLine = extractMultiLineField(content, 'Expériences Proposées')
  const inline = extractInfoField(content, 'Expériences Proposées')

  const rawText = (inline + '\n' + multiLine.join('\n')).toLowerCase()
  const found: string[] = []

  for (const exp of EXPERIENCE_LIST) {
    const expLower = exp.name.toLowerCase()
    // Check for partial match
    const keywords = expLower.split(/[\s/()]+/).filter(w => w.length > 3)
    const matchCount = keywords.filter(kw => rawText.includes(kw)).length
    if (matchCount >= Math.max(1, keywords.length * 0.5)) {
      found.push(exp.name)
    }
  }

  // Also check for role mentions inline
  if (rawText.includes('antiship')) found.push('Rôle : ANTISHIP')
  if (rawText.includes('cap') && (rawText.includes('rôle') || rawText.includes('role'))) found.push('Rôle : CAP')
  if (rawText.includes('cas') && (rawText.includes('rôle') || rawText.includes('role'))) found.push('Rôle : CAS')
  if (rawText.includes('sead')) found.push('Rôle : SEAD')
  if (rawText.includes('strike') && (rawText.includes('rôle') || rawText.includes('role'))) found.push('Rôle : STRIKE')
  if (rawText.includes('recon')) found.push('Rôle : RECON')

  return [...new Set(found)]
}

function extractSoughtModules(content: string): string[] {
  const raw = extractInfoField(content, 'Recherché par la Commu')
  if (!raw) return []
  const names = new Set<string>()
  for (const part of raw.split(/[,;\n]/)) {
    const normalized = normalizeModuleName(part.replace(/\*\*/g, '').trim())
    if (normalized) names.add(normalized)
  }
  return [...names]
}

// ── Main seed function ─────────────────────────────────

async function seed() {
  console.log('🌱 Starting seed...')
  const client = postgres(DATABASE_URL, { max: 1 })
  const db = drizzle(client, { schema })

  // Create tables from scratch (push approach)
  console.log('📦 Seeding reference data...')

  // Insert modules
  for (const mod of MODULE_LIST) {
    await db.insert(schema.modules).values({
      name: mod.name,
      category: mod.category,
    }).onConflictDoNothing()
  }
  const allModules = await db.select().from(schema.modules)
  const moduleMap = new Map(allModules.map(m => [m.name, m.id]))
  console.log(`  ✓ ${allModules.length} modules`)

  // Insert experiences
  for (const exp of EXPERIENCE_LIST) {
    await db.insert(schema.experiences).values({
      name: exp.name,
      slug: exp.slug,
    }).onConflictDoNothing()
  }
  const allExperiences = await db.select().from(schema.experiences)
  const expMap = new Map(allExperiences.map(e => [e.name, e.id]))
  console.log(`  ✓ ${allExperiences.length} experiences`)

  // Parse and insert communities
  const files = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.md') && f !== '_template.md')
  console.log(`\n📄 Parsing ${files.length} community files...`)

  let inserted = 0
  for (const file of files) {
    const slug = file.replace('.md', '')
    const content = fs.readFileSync(path.join(ARCHIVE_DIR, file), 'utf-8')
    const fm = extractFrontmatter(content)
    const h1 = extractFirstH1(content)
    const name = h1 || fm.title || slug

    console.log(`  → ${slug}: ${name}`)

    const description = extractDescription(content)
    const objectives = extractObjectives(content)
    const links = extractLinks(content)
    const logoUrl = extractLogoUrl(content, slug)
    const images = extractImages(content)

    const sizeText = extractInfoField(content, 'Taille')
    const typeText = extractInfoField(content, 'Type')
    const recruitText = extractInfoField(content, 'Recrutement')
    const freqText = extractInfoField(content, 'Fréquence des évènements')
    const founder = extractInfoField(content, 'Fondateur') || extractInfoField(content, 'Fondateurs')
    const contact = extractInfoField(content, 'Contact Principal') || extractInfoField(content, 'Contacts Principaux') || extractInfoField(content, 'Contact(s)')
    const entryConditions = extractInfoField(content, "Conditions d'Entrée")
    const objectiveField = extractInfoField(content, 'Objectif du Groupe')

    // Generate a short description
    const firstLine = description ? description.split('\n')[0] ?? '' : ''
    const shortDesc = description
      ? firstLine.slice(0, 200) + (firstLine.length > 200 ? '…' : '')
      : null

    // Insert community
    const [community] = await db.insert(schema.communities).values({
      slug,
      name: name.replace(/\s+/g, ' ').trim(),
      shortDescription: shortDesc,
      description: description || null,
      objectives: objectives || objectiveField || null,
      logoUrl,
      sizeCategory: (mapSizeCategory(sizeText) as any) || 'unknown',
      communityType: (mapCommunityType(typeText) as any) || 'other',
      recruitmentStatus: (mapRecruitment(recruitText) as any) || 'unknown',
      eventFrequency: (mapEventFrequency(freqText) as any) || 'unknown',
      founder: founder || null,
      contact: contact || null,
      entryConditions: entryConditions || null,
      sizeText: sizeText || null,
      discordUrl: links.discord || null,
      websiteUrl: links.website || null,
      youtubeUrl: links.youtube || null,
      instagramUrl: links.instagram || null,
      facebookUrl: links.facebook || null,
      twitchUrl: links.twitch || null,
      twitterUrl: links.twitter || null,
      published: true,
      featured: false,
    }).onConflictDoNothing().returning()

    if (!community) {
      console.log(`    ⚠ Skipped (already exists)`)
      continue
    }

    // Insert modules
    const moduleNames = extractModules(content)
    for (const modName of moduleNames) {
      const modId = moduleMap.get(modName)
      if (modId) {
        await db.insert(schema.communityModules).values({
          communityId: community.id,
          moduleId: modId,
        }).onConflictDoNothing()
      }
    }

    // Insert sought modules
    const soughtNames = extractSoughtModules(content)
    for (const modName of soughtNames) {
      const modId = moduleMap.get(modName)
      if (modId) {
        await db.insert(schema.communitySoughtModules).values({
          communityId: community.id,
          moduleId: modId,
        }).onConflictDoNothing()
      }
    }

    // Insert experiences
    const experienceNames = extractExperiences(content)
    for (const expName of experienceNames) {
      const expId = expMap.get(expName)
      if (expId) {
        await db.insert(schema.communityExperiences).values({
          communityId: community.id,
          experienceId: expId,
        }).onConflictDoNothing()
      }
    }

    // Insert historical periods
    const periods = mapPeriods(content)
    for (const period of periods) {
      await db.insert(schema.communityHistoricalPeriods).values({
        communityId: community.id,
        period: period as any,
      }).onConflictDoNothing()
    }

    // Insert images
    for (let i = 0; i < images.length; i++) {
      await db.insert(schema.communityImages).values({
        communityId: community.id,
        url: images[i]!,
        alt: `${name} - Image ${i + 1}`,
        sortOrder: i,
      })
    }

    inserted++
    console.log(`    ✓ modules: ${moduleNames.length}, exp: ${experienceNames.length}, periods: ${periods.length}, images: ${images.length}`)
  }

  console.log(`\n✅ Done! Inserted ${inserted} communities.`)
  await client.end()
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
