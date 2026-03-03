#!/usr/bin/env tsx
/**
 * Generates a standalone seed.sql file from the archived VitePress Markdown files.
 * No database connection needed — runs purely on the filesystem.
 *
 * Usage:
 *   npx tsx scripts/generate-seed-sql.ts
 *   # => outputs scripts/seed.sql
 *
 * Then on Coolify (PostgreSQL terminal):
 *   psql -U commus -d commus_dcs -f seed.sql
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ARCHIVE_DIR = path.resolve(__dirname, '../.archive/docs/commus')
const OUTPUT_FILE = path.resolve(__dirname, 'seed.sql')

// ── Reference data ─────────────────────────────────────

const MODULE_LIST: { name: string; category: string }[] = [
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
  { name: 'MiG-15', category: 'eastern_fixed' },
  { name: 'MiG-19', category: 'eastern_fixed' },
  { name: 'MiG-21', category: 'eastern_fixed' },
  { name: 'MiG-29', category: 'eastern_fixed' },
  { name: 'Su-25A', category: 'eastern_fixed' },
  { name: 'Su-25T', category: 'eastern_fixed' },
  { name: 'Su-27', category: 'eastern_fixed' },
  { name: 'Su-33', category: 'eastern_fixed' },
  { name: 'AH-64D', category: 'helicopter' },
  { name: 'Ka-50', category: 'helicopter' },
  { name: 'Mi-24', category: 'helicopter' },
  { name: 'Mi-8', category: 'helicopter' },
  { name: 'SA-342', category: 'helicopter' },
  { name: 'UH-1', category: 'helicopter' },
  { name: 'BF-109', category: 'ww2' },
  { name: 'FW-190', category: 'ww2' },
  { name: 'I-16', category: 'ww2' },
  { name: 'Mosquito', category: 'ww2' },
  { name: 'P-47D', category: 'ww2' },
  { name: 'P-51D', category: 'ww2' },
  { name: 'Spitfire', category: 'ww2' },
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

// ── SQL helpers ────────────────────────────────────────

function esc(val: string | null | undefined): string {
  if (val === null || val === undefined || val === '') return 'NULL'
  return `'${val.replace(/'/g, "''")}'`
}

// ── Parsing helpers (same as seed.ts) ──────────────────

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
  const patterns = [
    /##\s+Présentation\s+du\s+groupe\s*\n([\s\S]*?)(?=\n##\s|$)/i,
    /##\s+Présentation\s+de\s+la\s+communaut[ée]\s*\n([\s\S]*?)(?=\n##\s|$)/i,
    /##\s+Description\s*\n([\s\S]*?)(?=\n##\s|$)/i,
    /##\s+Présentation\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  ]
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) return match[1]!.trim().replace(/<[^>]+>/g, '').trim()
  }
  return ''
}

function extractObjectives(content: string): string {
  const match = content.match(/##\s+Objectifs?\s+(?:de\s+l['']escadron|du\s+[Gg]roupe)\s*\n([\s\S]*?)(?=\n##\s|$)/i)
  if (match) return match[1]!.trim().replace(/<[^>]+>/g, '').trim()
  return ''
}

function extractInfoField(content: string, fieldName: string): string {
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

function extractLinks(content: string): Record<string, string | undefined> {
  const links: Record<string, string | undefined> = {}
  const discordMatch = content.match(/https?:\/\/discord\.gg\/[\w-]+/i) || content.match(/https?:\/\/discord\.com\/invite\/[\w-]+/i)
  if (discordMatch) links.discord = discordMatch[0]
  const siteMatch = content.match(/\[.*?(?:site|Site).*?\]\((https?:\/\/(?!discord)[^\s)]+)\)/)
  if (siteMatch) links.website = siteMatch[1]
  const ytMatch = content.match(/https?:\/\/(?:www\.)?youtube\.com\/[\w@/-]+/i) || content.match(/https?:\/\/youtu\.be\/[\w-]+/i)
  if (ytMatch) links.youtube = ytMatch[0]
  const igMatch = content.match(/https?:\/\/(?:www\.)?instagram\.com\/[\w.-]+/i)
  if (igMatch) links.instagram = igMatch[0]
  const fbMatch = content.match(/https?:\/\/(?:www\.)?facebook\.com\/[\w.-]+/i)
  if (fbMatch) links.facebook = fbMatch[0]
  const twMatch = content.match(/https?:\/\/(?:www\.)?twitch\.tv\/[\w.-]+/i)
  if (twMatch) links.twitch = twMatch[0]
  const xMatch = content.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[\w.-]+/i)
  if (xMatch) links.twitter = xMatch[0]
  return links
}

function extractLogoUrl(content: string): string | null {
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
  if (t.includes('très fréquent') || (t.includes('+1') && t.includes('semaine')) || t.includes("+ d'1 par semaine") || t.includes("plus d'1")) return 'very_frequent'
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
  const t = periodsBody.toLowerCase()
  if (t.includes('ww2') || t.includes('1940')) periods.push('ww2')
  if (t.includes('early') && t.includes('1950')) periods.push('cold_war_early')
  if (t.includes('mid') && (t.includes('1960') || t.includes('1970'))) periods.push('cold_war_mid')
  if (t.includes('late') && (t.includes('1970') || t.includes('1980'))) periods.push('cold_war_late')
  if (t.includes('gulf') || t.includes('1990') || t.includes('golfe')) periods.push('gulf_war')
  if (t.includes('début moderne') || t.includes('2000')) periods.push('early_modern')
  if (t.includes('post moderne') || t.includes('2010')) periods.push('post_modern')
  if (t.includes('aucune')) periods.push('none')
  return periods.length ? periods : ['none']
}

const NAME_MAP: Record<string, string> = {
  'a-10a': 'A-10A', 'a-10c': 'A-10C', 'a-10cii': 'A-10C', 'a-10c ii': 'A-10C',
  'a-4e': 'A-4E', 'a4e': 'A-4E',
  'ajs-37': 'AJS-37', 'ajs37': 'AJS-37', 'viggen': 'AJS-37',
  'av-8b': 'AV-8B', 'av8b': 'AV-8B', 'harrier': 'AV-8B',
  'c-101': 'C-101', 'c-130': 'C-130', 'hercules': 'C-130',
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

function normalizeModuleName(raw: string): string | null {
  const t = raw.trim().replace(/[,;]/g, '').replace(/\s+/g, ' ').trim()
  const lower = t.toLowerCase()
  if (NAME_MAP[lower]) return NAME_MAP[lower]!
  for (const [key, val] of Object.entries(NAME_MAP)) {
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

  if (rawText.match(/tous\s+les\s+modules?\s+avions?/i)) {
    return MODULE_LIST.filter(m => m.category !== 'helicopter' && m.category !== 'other').map(m => m.name)
  }

  const names = new Set<string>()
  for (const part of rawText.split(/[,;\n]/)) {
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
    const keywords = expLower.split(/[\s/()]+/).filter(w => w.length > 3)
    const matchCount = keywords.filter(kw => rawText.includes(kw)).length
    if (matchCount >= Math.max(1, keywords.length * 0.5)) {
      found.push(exp.name)
    }
  }

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

// ── SQL generation ─────────────────────────────────────

function main() {
  const sql: string[] = []

  sql.push(`-- ============================================`)
  sql.push(`-- Commus DCS FR — Auto-generated seed.sql`)
  sql.push(`-- Generated: ${new Date().toISOString()}`)
  sql.push(`-- ============================================`)
  sql.push(``)
  sql.push(`BEGIN;`)
  sql.push(``)

  // ── Schema: Enums ──
  sql.push(`-- ── Enums ──`)
  sql.push(`DO $$ BEGIN`)
  sql.push(`  CREATE TYPE size_category AS ENUM ('hub_300_plus','very_large_150_plus','large_50_plus','medium_30_plus','medium_under_30','small','unknown');`)
  sql.push(`EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
  sql.push(`DO $$ BEGIN`)
  sql.push(`  CREATE TYPE community_type AS ENUM ('semi_open_squadron','closed_squadron','open_community','event_only','esport_team','content_creator','mod_development','screenshot_community','atc_community','other');`)
  sql.push(`EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
  sql.push(`DO $$ BEGIN`)
  sql.push(`  CREATE TYPE recruitment_status AS ENUM ('open','closed','none','unknown');`)
  sql.push(`EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
  sql.push(`DO $$ BEGIN`)
  sql.push(`  CREATE TYPE event_frequency AS ENUM ('very_active','very_frequent','weekly','biweekly','monthly','occasional','unknown');`)
  sql.push(`EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
  sql.push(`DO $$ BEGIN`)
  sql.push(`  CREATE TYPE historical_period AS ENUM ('ww2','cold_war_early','cold_war_mid','cold_war_late','gulf_war','early_modern','post_modern','none');`)
  sql.push(`EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
  sql.push(`DO $$ BEGIN`)
  sql.push(`  CREATE TYPE submission_status AS ENUM ('pending','approved','rejected');`)
  sql.push(`EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
  sql.push(``)

  // ── Schema: Tables ──
  sql.push(`-- ── Tables ──`)
  sql.push(`CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  short_description TEXT,
  description TEXT,
  objectives TEXT,
  logo_url TEXT,
  size_category size_category DEFAULT 'unknown',
  community_type community_type DEFAULT 'other',
  recruitment_status recruitment_status DEFAULT 'unknown',
  event_frequency event_frequency DEFAULT 'unknown',
  founder VARCHAR(255),
  contact VARCHAR(255),
  entry_conditions TEXT,
  size_text VARCHAR(255),
  discord_url TEXT,
  website_url TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  twitch_url TEXT,
  twitter_url TEXT,
  other_links JSONB,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`)
  sql.push(``)
  sql.push(`CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  icon_url TEXT
);`)
  sql.push(``)
  sql.push(`CREATE TABLE IF NOT EXISTS experiences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50)
);`)
  sql.push(``)
  sql.push(`CREATE TABLE IF NOT EXISTS community_modules (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE
);`)
  sql.push(``)
  sql.push(`CREATE TABLE IF NOT EXISTS community_sought_modules (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE
);`)
  sql.push(``)
  sql.push(`CREATE TABLE IF NOT EXISTS community_experiences (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE
);`)
  sql.push(``)
  sql.push(`CREATE TABLE IF NOT EXISTS community_historical_periods (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  period historical_period NOT NULL
);`)
  sql.push(``)
  sql.push(`CREATE TABLE IF NOT EXISTS community_images (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt VARCHAR(255),
  sort_order INTEGER DEFAULT 0
);`)
  sql.push(``)
  sql.push(`CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  community_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  discord_url TEXT,
  website_url TEXT,
  description TEXT,
  status submission_status DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`)
  sql.push(``)

  // ── Data: Modules ──
  sql.push(`-- ── Reference: Modules ──`)
  for (const mod of MODULE_LIST) {
    sql.push(`INSERT INTO modules (name, category) VALUES (${esc(mod.name)}, ${esc(mod.category)}) ON CONFLICT (name) DO NOTHING;`)
  }
  sql.push(``)

  // Build module name → id map (we'll use subqueries in INSERT)
  // Actually, since we don't know IDs, we'll use subqueries

  // ── Data: Experiences ──
  sql.push(`-- ── Reference: Experiences ──`)
  for (const exp of EXPERIENCE_LIST) {
    sql.push(`INSERT INTO experiences (name, slug) VALUES (${esc(exp.name)}, ${esc(exp.slug)}) ON CONFLICT (name) DO NOTHING;`)
  }
  sql.push(``)

  // ── Data: Communities ──
  const files = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.md') && f !== '_template.md')
  console.log(`📄 Parsing ${files.length} community files...`)

  let inserted = 0

  for (const file of files) {
    const slug = file.replace('.md', '')
    const content = fs.readFileSync(path.join(ARCHIVE_DIR, file), 'utf-8')
    const fm = extractFrontmatter(content)
    const h1 = extractFirstH1(content)
    const name = (h1 || fm.title || slug).replace(/\s+/g, ' ').trim()

    console.log(`  → ${slug}: ${name}`)

    const description = extractDescription(content)
    const objectives = extractObjectives(content)
    const links = extractLinks(content)
    const logoUrl = extractLogoUrl(content)
    const images = extractImages(content)

    const sizeText = extractInfoField(content, 'Taille')
    const typeText = extractInfoField(content, 'Type')
    const recruitText = extractInfoField(content, 'Recrutement')
    const freqText = extractInfoField(content, 'Fréquence des évènements')
    const founder = extractInfoField(content, 'Fondateur') || extractInfoField(content, 'Fondateurs')
    const contact = extractInfoField(content, 'Contact Principal') || extractInfoField(content, 'Contacts Principaux') || extractInfoField(content, 'Contact(s)')
    const entryConditions = extractInfoField(content, "Conditions d'Entrée")
    const objectiveField = extractInfoField(content, 'Objectif du Groupe')

    const firstLine = description ? description.split('\n')[0] ?? '' : ''
    const shortDesc = description
      ? firstLine.slice(0, 200) + (firstLine.length > 200 ? '…' : '')
      : null

    sql.push(`-- ── Community: ${name} ──`)
    sql.push(`INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES (${esc(slug)}, ${esc(name)}, ${esc(shortDesc)}, ${esc(description || null)}, ${esc(objectives || objectiveField || null)}, ${esc(logoUrl)}, ${esc(mapSizeCategory(sizeText))}::size_category, ${esc(mapCommunityType(typeText))}::community_type, ${esc(mapRecruitment(recruitText))}::recruitment_status, ${esc(mapEventFrequency(freqText))}::event_frequency, ${esc(founder || null)}, ${esc(contact || null)}, ${esc(entryConditions || null)}, ${esc(sizeText || null)}, ${esc(links.discord)}, ${esc(links.website)}, ${esc(links.youtube)}, ${esc(links.instagram)}, ${esc(links.facebook)}, ${esc(links.twitch)}, ${esc(links.twitter)}, true, false)
ON CONFLICT (slug) DO NOTHING;`)

    // Modules (using subqueries for IDs)
    const moduleNames = extractModules(content)
    for (const modName of moduleNames) {
      sql.push(`INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = ${esc(slug)} AND m.name = ${esc(modName)} ON CONFLICT DO NOTHING;`)
    }

    // Sought modules
    const soughtNames = extractSoughtModules(content)
    for (const modName of soughtNames) {
      sql.push(`INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = ${esc(slug)} AND m.name = ${esc(modName)} ON CONFLICT DO NOTHING;`)
    }

    // Experiences
    const experienceNames = extractExperiences(content)
    for (const expName of experienceNames) {
      sql.push(`INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = ${esc(slug)} AND e.name = ${esc(expName)} ON CONFLICT DO NOTHING;`)
    }

    // Historical periods
    const periods = mapPeriods(content)
    for (const period of periods) {
      sql.push(`INSERT INTO community_historical_periods (community_id, period) SELECT c.id, ${esc(period)}::historical_period FROM communities c WHERE c.slug = ${esc(slug)};`)
    }

    // Images
    for (let i = 0; i < images.length; i++) {
      sql.push(`INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, ${esc(images[i])}, ${esc(`${name} - Image ${i + 1}`)}, ${i} FROM communities c WHERE c.slug = ${esc(slug)};`)
    }

    sql.push(``)
    inserted++
    console.log(`    ✓ modules: ${moduleNames.length}, exp: ${experienceNames.length}, periods: ${periods.length}, images: ${images.length}`)
  }

  sql.push(`COMMIT;`)
  sql.push(``)
  sql.push(`-- Summary: ${inserted} communities from ${files.length} files`)

  fs.writeFileSync(OUTPUT_FILE, sql.join('\n'), 'utf-8')
  console.log(`\n✅ Generated ${OUTPUT_FILE}`)
  console.log(`   ${sql.length} SQL lines, ${inserted} communities`)
}

main()
