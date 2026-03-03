-- ============================================
-- Commus DCS FR — Auto-generated seed.sql
-- Generated: 2026-03-03T12:28:46.520Z
-- ============================================

BEGIN;

-- ── Enums ──
DO $$ BEGIN
  CREATE TYPE size_category AS ENUM ('hub_300_plus','very_large_150_plus','large_50_plus','medium_30_plus','medium_under_30','small','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE community_type AS ENUM ('semi_open_squadron','closed_squadron','open_community','event_only','esport_team','content_creator','mod_development','screenshot_community','atc_community','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE recruitment_status AS ENUM ('open','closed','none','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE event_frequency AS ENUM ('very_active','very_frequent','weekly','biweekly','monthly','occasional','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE historical_period AS ENUM ('ww2','cold_war_early','cold_war_mid','cold_war_late','gulf_war','early_modern','post_modern','none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ──
CREATE TABLE IF NOT EXISTS communities (
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
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Migration: add votes column if upgrading from older schema
ALTER TABLE communities ADD COLUMN IF NOT EXISTS votes INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  icon_url TEXT
);

CREATE TABLE IF NOT EXISTS experiences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS community_modules (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_sought_modules (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_experiences (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  experience_id INTEGER NOT NULL REFERENCES experiences(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_historical_periods (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  period historical_period NOT NULL
);

CREATE TABLE IF NOT EXISTS community_images (
  id SERIAL PRIMARY KEY,
  community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt VARCHAR(255),
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS submissions (
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
);

-- ── Reference: Modules ──
INSERT INTO modules (name, category) VALUES ('A-10A', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('A-10C', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('A-4E', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('AJS-37', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('AV-8B', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('C-101', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('C-130', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('F-4E', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('F-5E', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('F-14', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('F-15C', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('F-15E', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('F-16C', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('F-86', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('F/A-18C', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('JF-17', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('L-39', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('M2000-C', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('MB-339', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Mirage F1', 'western_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('MiG-15', 'eastern_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('MiG-19', 'eastern_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('MiG-21', 'eastern_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('MiG-29', 'eastern_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Su-25A', 'eastern_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Su-25T', 'eastern_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Su-27', 'eastern_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Su-33', 'eastern_fixed') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('AH-64D', 'helicopter') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Ka-50', 'helicopter') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Mi-24', 'helicopter') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Mi-8', 'helicopter') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('SA-342', 'helicopter') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('UH-1', 'helicopter') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('BF-109', 'ww2') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('FW-190', 'ww2') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('I-16', 'ww2') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Mosquito', 'ww2') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('P-47D', 'ww2') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('P-51D', 'ww2') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Spitfire', 'ww2') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Combined Arms', 'other') ON CONFLICT (name) DO NOTHING;
INSERT INTO modules (name, category) VALUES ('Flaming Cliffs', 'other') ON CONFLICT (name) DO NOTHING;

-- ── Reference: Experiences ──
INSERT INTO experiences (name, slug) VALUES ('Aerobatics', 'aerobatics') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Campagnes Dynamiques (DSMC/Liberation)', 'campagnes-dynamiques') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Communauté dédiée aux Débutants', 'debutants') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Communauté dédiée aux confirmés/pilotes aguerris', 'confirmes') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Compétitions Inter-Communautaires', 'competitions-inter') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Entraînements pour Inscrits', 'entrainements-inscrits') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Entraînements pour Public', 'entrainements-public') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Escadron Multi-Branches', 'multi-branches') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Formations à la Phraséo/Communication (SRS)', 'formations-srs') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Meetings Aériens Virtuels', 'meetings-aeriens') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Missions Arcade/Fun', 'missions-arcade') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Missions MILSIM Lite', 'milsim-lite') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Missions MILSIM++', 'milsim-plus') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Présence Tuteurs pour Modules', 'tuteurs') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Présence d''AWACS Humains (Avec/Sans LotATC)', 'awacs-humains') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Présence d''un Serveur Dédié 24/7', 'serveur-24-7') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Présence d''un Serveur Dédié à la demande', 'serveur-a-la-demande') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Rôle : ANTISHIP', 'role-antiship') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Rôle : CAP', 'role-cap') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Rôle : CAS', 'role-cas') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Rôle : SEAD', 'role-sead') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Rôle : STRIKE', 'role-strike') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Rôle : RECON', 'role-recon') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Tournois (Dogfight/BVR/etc)', 'tournois') ON CONFLICT (name) DO NOTHING;
INSERT INTO experiences (name, slug) VALUES ('Événements Inter-Communautaires', 'evenements-inter') ON CONFLICT (name) DO NOTHING;

-- ── Community: 06th MHR (Multirole Helicopter Regiment) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('06mhr', '06th MHR (Multirole Helicopter Regiment)', 'La 06th MHR est un régiment hélicoptère, appuyé par une escadrille d''appui aérien, et composé de plus d''une trentaine de membres. Chaque lundi, nous participons à une séance d''entraînement, et chaque …', 'La 06th MHR est un régiment hélicoptère, appuyé par une escadrille d''appui aérien, et composé de plus d''une trentaine de membres. Chaque lundi, nous participons à une séance d''entraînement, et chaque jeudi, nous nous engageons dans l''accomplissement d''une mission, précédée d''un briefing complet. Nous prenons plaisir à voler ensemble, à progresser collectivement, et à participer à des missions immersives tout en respectant un minimum de procédures.', 'Nous prenons plaisir à voler ensemble, à progresser collectivement, et à participer à des missions immersives tout en respectant un minimum de procédures.', '/commus_img/06mhr.png', 'large_50_plus'::size_category, 'closed_squadron'::community_type, 'open'::recruitment_status, 'very_frequent'::event_frequency, 'Balerion/Kiwi', 'Balerion sur le site Discord de l''escadrille', '- Rejoindre notre Discord et se présenter dans notre salon "postuler".
  - Motivation et disponibilité pour nos deux rendez-vous hebdomadaires.', 'Grande Taille (+50 pilotes)', 'https://discord.gg/bzDJvQrnTQ', NULL, NULL, NULL, 'https://www.facebook.com/groups', NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '06mhr' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '06mhr' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '06mhr' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '06mhr' AND m.name = 'Ka-50' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '06mhr' AND m.name = 'Mi-24' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '06mhr' AND m.name = 'Mi-8' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '06mhr' AND m.name = 'SA-342' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '06mhr' AND m.name = 'UH-1' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '06mhr' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '06mhr' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '06mhr' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '06mhr' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '06mhr' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '06mhr' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '06mhr' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '06mhr' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = '06mhr';

-- ── Community: 102th Phoenix ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('102th', '102th Phoenix', '## Informations Complémentaires', '## Informations Complémentaires', NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/2QNtCJmayE', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = '102th';

-- ── Community: 131st Death Viper ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('131dv', '131st Death Viper', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/MucESSWp', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = '131dv';

-- ── Community: 1er ROC ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('1roc', '1er ROC', 'Nous disposons d''un serveur opérationnel 24/7 sur lequel nous hébergeons une mission dynamique Pretense créée par Dzsek et améliorée par nos soins. Nous jouons également sur des missions élaborées par…', 'Nous disposons d''un serveur opérationnel 24/7 sur lequel nous hébergeons une mission dynamique Pretense créée par Dzsek et améliorée par nos soins. Nous jouons également sur des missions élaborées par notre pôle opération pour mettre en pratique nos connaissances dans un environnement plus poussé.
Des missions plus rapide pour être directement dans le feu de l''action sont également organisées environs une fois par semaine.', 'Détecter, identifier, intervenir, traiter, soutenir et fortifier. Nous faisons de tout et pour tout le monde. Nous voulons être une communauté ouverte et accueillante, ni trop dure ni trop simple.', '/commus_img/1roc.png', 'unknown'::size_category, 'other'::community_type, 'open'::recruitment_status, 'weekly'::event_frequency, 'Amiral J. Seluj', 'Lt. Colonel Nomad, Lt. Colonel Dread, Amiral Seluj', 'Ouvert à tous les niveaux d''expérience, du novice à l''expert, le 1er ROC accueille chaleureusement tous ceux qui souhaitent rejoindre leur communauté.', NULL, 'https://discord.gg/tz8xVd5aFS', 'https://www.1roc.fr', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '1roc' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '1roc' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = '1roc';

-- ── Community: 2nd French Fighter Squadron (2nd-FFS) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('2ffs', '2nd French Fighter Squadron (2nd-FFS)', 'La 2nd-FFS est une escadre virtuelle francophone évoluant sur DCS World, le simulateur de combat aérien d´Eagle Dynamics. Créée en 2006, la 2nd-FFS est actuellement constituée d''une vingtaine de passi…', 'La 2nd-FFS est une escadre virtuelle francophone évoluant sur DCS World, le simulateur de combat aérien d´Eagle Dynamics. Créée en 2006, la 2nd-FFS est actuellement constituée d''une vingtaine de passionnés d´aviation militaire. Généralement les pilotes de la 2nd-FFS se retrouvent deux fois par semaine le lundi et le jeudi à partir de 21h. Nous disposons de nos propres serveurs et nous utilisons SRS pour les communications radio.', 'Afin de reproduire les conditions de vol et du combat aérien les plus réalistes possibles, la 2ND-FFS s´inspire des procédures et documents réels.', '/commus_img/2ffs.png', 'medium_30_plus'::size_category, 'closed_squadron'::community_type, 'open'::recruitment_status, 'very_frequent'::event_frequency, 'Robin/Rikko', 'Robin/Rikko', 'Utiliser le channel "postuler-chez-nous" sur notre Discord.', 'Moyenne Taille (30 pilotes)', 'https://discord.gg/ECNeV6B7WC', 'http://2nd-ffs.fr/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'Combined Arms' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'Flaming Cliffs' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'Mi-24' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'Mi-8' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'SA-342' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'UH-1' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '2ffs' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Aerobatics' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '2ffs' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = '2ffs';

-- ── Community: 3rd WING (3rd) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('3rdwing', '3rd WING (3rd)', 'Créée en juin 2004, l''Escadre de Chasse Virtuelle 3rd Wing est un regroupement de passionnés d’Aviation volant sur les modules du simulateur d’Eagle Dynamics DCS World, intégrant la dimension contrôle…', 'Créée en juin 2004, l''Escadre de Chasse Virtuelle 3rd Wing est un regroupement de passionnés d’Aviation volant sur les modules du simulateur d’Eagle Dynamics DCS World, intégrant la dimension contrôle via LotATC et Combined Arms. L''Escadre de Chasse Virtuelle 3rd Wing (ECV3W) est une structure organisée qui, depuis 2020, évolue sous la forme d''une association "Loi 1901" (à but non lucratif). En 2023, ce sont plus de 80 pilotes, désormais membres de l''association "Escadre de Chasse Virtuelle 3rd Wing (ECV3W)" qui évoluent au sein de nos 10 escadrons. La 3rd Wing dispose d''importants moyens pour que chaque pilote puisse assouvir sa passion dans les meilleures conditions.', NULL, '/commus_img/3rdwing.png', 'very_large_150_plus'::size_category, 'closed_squadron'::community_type, 'open'::recruitment_status, 'very_frequent'::event_frequency, 'Doug & Ezor (Lead)', 'Forum ([http://www.3rd-wing.net](http://www.3rd-wing.net))', '- Maîtriser l''atterrissage et le décollage
  - Savoir un minimum voler en formation
  - Bien connaître son avion, ses instruments
  - Disposer du logiciel Teamspeak 3 pour discuter ensemble
  - Savoir rejoindre une partie multijoueur depuis DCS World, idéalement en disposant déjà du plug-in SRS pour la gestion des comms (simulation de la radio).', 'Très Grande Taille (+150 pilotes)', 'https://discord.gg/T2avaA5', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'Combined Arms' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = '3rdwing' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = '3rdwing' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = '3rdwing';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = '3rdwing';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = '3rdwing';

-- ── Community: Discord AAE Esport/Gaming ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('aaeeg', 'Discord AAE Esport/Gaming', 'Pour tous ceux qui sont intéressés, voici le Discord AAE Esport/Gaming. L''accès est ouvert aux civils, notamment à la partie publique. Nous organisons des événements, y compris des sessions DCS ouvert…', 'Pour tous ceux qui sont intéressés, voici le Discord AAE Esport/Gaming. L''accès est ouvert aux civils, notamment à la partie publique. Nous organisons des événements, y compris des sessions DCS ouvertes à tous, favorisant les interactions entre civils et passionnés de l''aviation militaire. Suivez les actualités et les nouvelles liées à notre association.', 'Notre devise est "l''union fait notre force", en privilégiant des vols de mission plaisants et sérieux sans pression excessive. Nous maintenons une approche équilibrée de la simulation.', NULL, 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'closed'::recruitment_status, 'unknown'::event_frequency, 'Inconnu', 'Inconnu', NULL, 'Moyenne (+30 membres)', 'https://discord.gg/aaeeg', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'aaeeg' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'aaeeg' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'aaeeg' AND e.name = 'Meetings Aériens Virtuels' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'aaeeg' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'aaeeg';

-- ── Community: Ashayar ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('ashayar', 'Ashayar', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.twitch.tv/Ashayar', NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'ashayar';

-- ── Community: ATAC ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('atac', 'ATAC', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/5pxVVNAr2v', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'atac';

-- ── Community: Bullseye Francophone (BFR) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('bfr', 'Bullseye Francophone (BFR)', 'BFR est une communauté comptant plus de 2000 membres, établie sur Discord et dotée de son propre serveur dédié. Ce serveur propose d''importants théâtres d''opération originaux et bénéficie d''un contrôl…', 'BFR est une communauté comptant plus de 2000 membres, établie sur Discord et dotée de son propre serveur dédié. Ce serveur propose d''importants théâtres d''opération originaux et bénéficie d''un contrôle humain, comprenant des responsabilités telles que l''ATC (contrôle de la circulation aérienne), l''AWACS (avion de surveillance et de commandement aéroporté) et le JTAC (contrôleur des attaques au sol).', 'Les objectifs de BFR tournent autour du fait de rassembler les pilotes virtuels dans le partage de connaissances à tous niveaux, la mise à disposition d''un serveur sur lequel on met en avant la communication et la coopération tout en donnant les éléments pour apprendre à le faire dans les règles de l''art. Le serveur (Discord comme DCS) se veut ouvert à tous les niveaux.', '/commus_img/bfr.png', 'hub_300_plus'::size_category, 'open_community'::community_type, 'none'::recruitment_status, 'monthly'::event_frequency, 'Tripack, Acta, Sakia, Stan Hursiak, OCageO, Dup (Lead)', 'Dup (id: mr_dup), OCageO (id: 0Cage0) via Discord', NULL, 'Hubs de la Communauté (+300 Membres)', 'https://discord.gg/8mpyQxPaZf', 'https://bullseye-francophone.fr/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Combined Arms' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Flaming Cliffs' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Ka-50' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Mi-24' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Mi-8' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'SA-342' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bfr' AND m.name = 'UH-1' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bfr' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'bfr';

-- ── Community: BOLT | Battlefield Operations Liaison Team ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('bolt', 'BOLT | Battlefield Operations Liaison Team', 'Bienvenue dans l''univers immersif de l''escadron B.O.L.T. - Battlefield Operations Liaison Team - dédié à DCS, où les puissantes forces de la Congrégation Rouge d''Europa et de l''Alliance Fédérale s''aff…', 'Bienvenue dans l''univers immersif de l''escadron B.O.L.T. - Battlefield Operations Liaison Team - dédié à DCS, où les puissantes forces de la Congrégation Rouge d''Europa et de l''Alliance Fédérale s''affrontent sans relâche dans les cieux virtuels. À un côté, la redoutable Force Aérienne du Pacte Rouge (FAPR) prête à défendre les idéaux de la Congrégation Rouge, et de l''autre, l''imposante Aégis Sky Corp (ASC) de l''Alliance Fédérale, prête à tout pour protéger son territoire et ses valeurs.

Cet escadron offre bien plus qu''un simple jeu de simulation aérienne. Plongez dans un monde où chaque participant peut contribuer au développement de l''histoire et façonner le destin de leur nation et de leur escadron. Choisissez votre camp avec soin, rejoignez une escadrille, et préparez-vous à l''action.

Dans ce théâtre de guerre virtuel, les missions sont soigneusement planifiées avec un objectif clair pour chaque camp : attaquer ou défendre. Chaque escadron doit remplir des objectifs primaires définis et tenter de réussir des objectifs secondaires, tirés au sort pour ajouter une dose de suspense. La somme des points obtenus dans l''accomplissement de ces objectifs déterminera le camp victorieux.

La gestion des ressources et de l''économie est essentielle. Les joueurs devront constituer leur armée avec un système économique défini par le format de la mission. La coopération et la stratégie seront les clés du succès, alors que chaque décision peut influencer le cours de la bataille.

Rejoignez-nous dans le ciel virtuel, où l''action, l''histoire et l''adrénaline vous attendent à chaque virage.', 'L''objectif est d''amener une certaine "rivalité" entre les différentes coalitions sans toxicité, faire progresser nos membres et s''amuser car c''est le plus important chez nous.', '/commus_img/bolt/bolt.png', 'large_50_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'unknown'::event_frequency, 'FanBoy & CHANUR', 'FanBoy (FanBoy9983)', 'Avoir l''appareil voulu, avoir les connaissances de bases en aéronautique.', 'Grande Taille', 'https://discord.gg/cas23dYpuY', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'UH-1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'bolt' AND m.name = 'SA-342' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'bolt' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_mid'::historical_period FROM communities c WHERE c.slug = 'bolt';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'bolt';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'bolt';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'bolt';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/bolt/bolt2.png', 'BOLT | Battlefield Operations Liaison Team - Image 1', 0 FROM communities c WHERE c.slug = 'bolt';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/bolt/bolt3.png', 'BOLT | Battlefield Operations Liaison Team - Image 2', 1 FROM communities c WHERE c.slug = 'bolt';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/bolt/bolt4.png', 'BOLT | Battlefield Operations Liaison Team - Image 3', 2 FROM communities c WHERE c.slug = 'bolt';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/bolt/bolt5.png', 'BOLT | Battlefield Operations Liaison Team - Image 4', 3 FROM communities c WHERE c.slug = 'bolt';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/bolt/bolt6.png', 'BOLT | Battlefield Operations Liaison Team - Image 5', 4 FROM communities c WHERE c.slug = 'bolt';

-- ── Community: Check-six <Badge type="warning" text="Piliers de la Communauté" /> ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('c6', 'Check-six <Badge type="warning" text="Piliers de la Communauté" />', 'Check-six (C6) est une communauté réunissant des passionnés de la simulation de vol de combat. Cette communauté utilise divers logiciels de simulation tels que IL2 - Battle of Stalingrad, Falcon 4 BMS…', 'Check-six (C6) est une communauté réunissant des passionnés de la simulation de vol de combat. Cette communauté utilise divers logiciels de simulation tels que IL2 - Battle of Stalingrad, Falcon 4 BMS, DCS World et Rise Of Flight.', NULL, '/commus_img/c6.png', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/8mpyQxPaZf', 'http://www.checksix-fr.com/', NULL, NULL, 'https://www.facebook.com/Checksixfrcom', NULL, 'https://twitter.com/Checksixfrcom', true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'c6';

-- ── Community: Canards Volant ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('canard', 'Canards Volant', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/uQm4xjUEtc', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'canard';

-- ── Community: Cellules Rapaces ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('cellulesrapaces', 'Cellules Rapaces', '🦅 La team **Cellules Rapaces** est une équipe francophone dédiée à la simulation de vol de combat, aujourd''hui sur DCS World. Fondée le **25 mars 2004**, cette équipe a pour ambition de constituer un…', '🦅 La team **Cellules Rapaces** est une équipe francophone dédiée à la simulation de vol de combat, aujourd''hui sur DCS World. Fondée le **25 mars 2004**, cette équipe a pour ambition de constituer une **équipe eSport** de référence.
Particularité : en tant qu''équipe d''aviateurs, elle représente également la communauté des *Gamers de l''Armée de l''Air et de l''Espace* dans les compétitions sur DCS World.', NULL, '/commus_img/cellules_rapaces.png', 'unknown'::size_category, 'esport_team'::community_type, 'open'::recruitment_status, 'unknown'::event_frequency, 'Couby', '`coubystark` sur Discord', NULL, '4 compétiteurs actifs (2024)', 'https://discord.gg/8mpyQxPaZf', 'https://www.cellules-rapaces.fr/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cellulesrapaces' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cellulesrapaces' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cellulesrapaces' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cellulesrapaces' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cellulesrapaces' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cellulesrapaces' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cellulesrapaces' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'cellulesrapaces';

-- ── Community: Cirrus Flight ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('cirrus', 'Cirrus Flight', 'La Cirrus Flight est un escadron français composé de 5 escadrilles participant à de nombreux événements tels qu''Endgame et des missions Couteau, entre autres. Ses pilotes incarnent les valeurs et la r…', 'La Cirrus Flight est un escadron français composé de 5 escadrilles participant à de nombreux événements tels qu''Endgame et des missions Couteau, entre autres. Ses pilotes incarnent les valeurs et la renommée de l''escadron. L''ambiance au sein de la Cirrus se veut bienveillante et sérieuse, favorisant ainsi la progression de chacun. L''escadron est constitué de pilotes, à la fois réels et virtuels, ayant une expérience variée. Sa réputation n''est plus à démontrer.', 'Nous visons la capacité de mettre en œuvre son appareil (en fonction de l''escadron choisi) par tous les temps, de jour comme de nuit. De plus, nous cherchons à exceller lors d''événements inter-communautaires tels que des tournois BVR et Endgame.', '/commus_img/cirrus.webp', 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'weekly'::event_frequency, 'Sim, Erepma, Azery', '`sim__` et `erepma_39` sur Discord, présent sur le discord du Kerboulistan, sur BFR, Couteau, Growling, Asta...', 'Maîtriser son module un minimum et surtout vouloir progresser, c''est le plus important. Un minimum de présence est attendue.', 'Moyenne Taille (+30 pilotes)', 'https://discord.gg/XF7kgadG7J', 'https://www.cirrus-flight.fr/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'cirrus' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'cirrus' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_late'::historical_period FROM communities c WHERE c.slug = 'cirrus';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'cirrus';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'cirrus';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'cirrus';

-- ── Community: Communauté COUTEAU ALPHA ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('couteau', 'Communauté COUTEAU ALPHA', 'Si certains d''entre vous recherchent une communauté accueillante, dynamique, avec une ambiance conviviale et très active, COUTEAU ALPHA est faite pour vous ! Ce nouveau venu commence fort et était trè…', 'Si certains d''entre vous recherchent une communauté accueillante, dynamique, avec une ambiance conviviale et très active, COUTEAU ALPHA est faite pour vous ! Ce nouveau venu commence fort et était très attendu par la communauté. En général, nos missions sont dotées de "persistance", conservant la progression des unités ennemies détruites à chaque redémarrage. Ces événements sont bien fréquentés, attirant en moyenne 10 à 15 personnes chaque soir.

Aucune restriction d''accès sur nos plateformes (Discord et serveur) ; c''est ouvert à tous, y compris aux débutants. En vol, l''utilisation idéale de SRS est recommandée, vous offrant une immersion et une expérience de jeu optimales tout en évitant les collisions entre les participants. Vous pourrez également discuter en vocal chaque soir, voler en groupe, et surtout vous amuser, le tout dans le respect. Un gros point positif que je tiens à souligner est la disponibilité d''une bibliothèque regroupant toutes nos fiches/notes sur nos modules, ainsi que les guides de Chuck et d''autres informations importantes.

Chaque mois, nous organisons une mission COUTEAU ALPHA pour apporter un peu de défi et de cohérence stratégique à la communauté.', 'Notre objectif global est de rassembler des passionnés autour d''une même passion commune et de proposer des événements accessibles à tous, peu importe le niveau de chacun.', '/commus_img/couteau.png', 'hub_300_plus'::size_category, 'open_community'::community_type, 'none'::recruitment_status, 'weekly'::event_frequency, 'LeBibs', 'xMinikut', 'Aucune condition', 'Hubs de la Communauté (+300 Membres)', 'https://discord.gg/2TBsfVNbFj', NULL, NULL, NULL, NULL, 'https://www.twitch.tv/le_bibs_', NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'couteau' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'couteau' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'couteau' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'couteau' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'couteau' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'couteau' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'couteau' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'couteau' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'couteau' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'ww2'::historical_period FROM communities c WHERE c.slug = 'couteau';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_early'::historical_period FROM communities c WHERE c.slug = 'couteau';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_mid'::historical_period FROM communities c WHERE c.slug = 'couteau';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_late'::historical_period FROM communities c WHERE c.slug = 'couteau';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'couteau';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'couteau';

-- ── Community: Contrôleurs Francophone (CTR FRA) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('ctrfra', 'Contrôleurs Francophone (CTR FRA)', NULL, NULL, NULL, '/commus_img/ctrfra.png', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/VgG4h9th8j', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'ctrfra';

-- ── Community: Dilixo Country ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('dilixo', 'Dilixo Country', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/A5daxTZ7MR', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'dilixo';

-- ── Community: Digital Joint Squadron ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('djs', 'Digital Joint Squadron', 'Cet escadron est composé de F16C aux couleurs du 309th Fighter Squadron et de F15E qui travaillent en complémentarité. Notre façon de jouer se veut sérieuse tout en cherchant à s''amuser.', 'Cet escadron est composé de F16C aux couleurs du 309th Fighter Squadron et de F15E qui travaillent en complémentarité. Notre façon de jouer se veut sérieuse tout en cherchant à s''amuser.

Les vols "officiels" ont lieu les Lundis et Mercredis soirs à 21h mais il n''est pas rare de voir des gens connectés et prêts à voler les week-ends. Nous n''imposons pas de quotas de présence, la vie réelle passera toujours avant DCS, aucuns soucis là dessus.

Nos vols alternent entre entrainements tactiques/modules, missions sur des serveurs publics type BFR ou Couteau, missions sur notre serveur Olympus et missions scénarisées. L''idée générale étant de débriefer chaque mission afin d''en tirer des enseignements et noter les choses à améliorer, choses qui seront ensuite vues lors d''un entrainement suivant. Les membres ont une belle expérience sur DCS et sur l''aviation militaire, nous avons également des contrôleurs aériens dans nos rangs qui ajoutent parfois du réalisme dans nos vols.

Les missions traitées au sein du DJS sont:
-Offensive Counter Air (Air Interdiction, SEAD/DEAD, SWEEP, ESCORT…)
-Defensive Counter Air (Air Defence, BARCAP, TARCAP...)

Ce groupe n''a pas vocation à former sur l''utilisation de l''appareil de A à Z mais nous accompagnons les nouveaux dans leur apprentissage. Nous focalisons les entrainements sur l''emploi tactique au sein d''une patrouille, notre objectif étant par la suite de pouvoir réaliser des COMAO (Composite Air Operations) d''envergure à plusieurs patrouilles. 
> [!NOTE]
> Pour les membres d''escadrons virtuels qui passeraient par là, nous sommes plus qu''intéressés par des missions en inter-escadrons, envoyez un message à l''un des admins !

Nous avons adopté un système de qualifications similaires à celui que nous pouvons retrouver dans les escadrons de chasse français. Le nouvel arrivant commencera en temps que PIM ou Pilote de Combat Opérationnel selon son niveau puis pourra être leader d''une patrouille de deux en devenant Sous Chef de Patrouille avant de finir Chef de Patrouille pouvant emmener quatre appareils au combat.

Pour les personnes simplement curieuses, nous vous attendons sur Discord dans l''⁠escale ou en vocal sur le Bar ! Passez dire bonjour et parlez avions !

Si cette présentation vous a donné envie de nous rejoindre, rendez vous dans le salon Discord ⁠bureau-du-recrutement pour y envoyer votre candidature : une petite présentation sur vous, si vous débutez ou non, votre expérience et vos connaissances sur le F-16 ou le F-15, votre maitrise du vol en formation et de la radio, si vous avez une préférence pour l''air-air ou l''air-sol, vos disponibilités, vos attentes, et tout ce que vous jugerez utile de nous dire.

Un membre de l''escadron vous répondra afin de trouver un créneau pour échanger en vocal, ensuite nous partirons en vol avec les gens présents pour un petit vol détente, histoire de vous montrer votre potentiel nouvel escadron 🙂 

Si vous avez des ⁠questions nous y répondrons avec plaisir, bonne visite et bons vols !', NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/3gqYeWETzm', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'djs';

-- ── Community: Escadrille d'Aviation 11 (EA11) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('ea11', 'Escadrille d''Aviation 11 (EA11)', 'L''Escadrille d''Aviation 11, en Allemand "Fliegerstaffel 11", évolue sur F/A-18 Hornet et nous vient de Suisse comme une partie des membres du Discord. Inspirés de l''escadrille réelle, nous avons forgé…', 'L''Escadrille d''Aviation 11, en Allemand "Fliegerstaffel 11", évolue sur F/A-18 Hornet et nous vient de Suisse comme une partie des membres du Discord. Inspirés de l''escadrille réelle, nous avons forgé notre propre identité. Notre serveur se veut convivial et amical, avec une atmosphère détendue. Durant les missions, nous demandons un minimum de sérieux. Nous souhaitons rassembler une communauté de passionnés d''aviation, confirmés ou débutants sur ce simulateur. Nous disposons d''un serveur dédié en version Open Beta, fonctionnant 24/7 avec des missions multi-joueurs. Nous volons sur divers appareils, avec une préférence pour le F/A-18 et le Mirage 2000. Des formations sont dispensées sur certains appareils, ainsi que la création de missions par nos membres. Nous disposons également d''une escadrille de Mirages et deux escadrilles de Hornets pour faciliter l''organisation et la cohésion des membres.', 'Non spécifié', '/commus_img/ea11.png', 'very_large_150_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'monthly'::event_frequency, '[EA-11] Séb "TINDER 1-1"', '- Discord : ea11jerem
  - FB : Jérémy Schad', 'Aucune', 'Très Grande Taille (+150 pilotes)', 'https://discord.gg/tcSGh4bZug', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ea11' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Aerobatics' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Meetings Aériens Virtuels' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ea11' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_mid'::historical_period FROM communities c WHERE c.slug = 'ea11';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'ea11';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'ea11';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'ea11';

-- ── Community: 13° Escadre de Chasse et de Transport RFV ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('ectrfv', '13° Escadre de Chasse et de Transport RFV', 'La 13ème escadre de chasse et de transport RFV, (RFV pour Red Falcons Virtu (nom d''origine)) créée en novembre 2013 est composée de pilotes répartis dans 2 escadrons. On fait du air-air, air-sol sur D…', 'La 13ème escadre de chasse et de transport RFV, (RFV pour Red Falcons Virtu (nom d''origine)) créée en novembre 2013 est composée de pilotes répartis dans 2 escadrons. On fait du air-air, air-sol sur DCS WORLD et du transport sur DCS WORLD et P3D/MFS. Principalement sur F/A-18C, F16C, MIRAGE 2000, F14B, F15E mais également quelques-uns qui font de l''hélicoptère pour le transport. On vole sur les cartes de la Syrie, Caucasse, Golf, îles Marianne et de temps en temps sur Nevada.', 'Notre devise est "l''union est notre force" et la tradition c''est de se faire plaisir en vol sans prise de tête mais avec du sérieux pendant les missions. On ne prend jamais à 100% au sérieux.', '/commus_img/ectrfv.webp', 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'monthly'::event_frequency, 'TangoLima', '- TangoLima
  - Thunder
  - Blade', '- Avoir 18 ans minimum
  - Avoir un minimum de connaissance sur le module piloté
  - Un minimum de matériel de vol (tout sauf manette de Xbox)
  - Un bon état d''esprit', 'Moyenne Taille (+30 pilotes)', 'https://discord.gg/w35BaYfe', NULL, 'https://youtube.com/@E-CT_RFV', 'https://instagram.com/13eme_escadre_de_c.t_rfv', 'https://www.facebook.com/E.CT.RFV', NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'ectrfv' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Meetings Aériens Virtuels' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'ectrfv' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'ectrfv';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'ectrfv';

-- ── Community: Escadre Guerre Froide Francophone (EGFF) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('egff', 'Escadre Guerre Froide Francophone (EGFF)', 'Bienvenue sur l''Escadre Guerre Froide Francophone (EGFF). Ce groupe rassemble des passionnés de simulation de vol souhaitant effectuer des vols réalistes, plus ou moins historiques, centrés sur la pér…', 'Bienvenue sur l''Escadre Guerre Froide Francophone (EGFF). Ce groupe rassemble des passionnés de simulation de vol souhaitant effectuer des vols réalistes, plus ou moins historiques, centrés sur la période de la guerre froide. Cette période s''étend des années 1970 jusqu''au début de l''année 1985 et inclut tous les conflits de cette époque, ainsi que des scénarios hypothétiques comme un affrontement entre le Pacte de Varsovie et l''OTAN.', NULL, '/commus_img/egff.png', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'egff';

-- ── Community: Escadron de Reconnaissance et d'Attaque Français (ERAF) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('eraf', 'Escadron de Reconnaissance et d''Attaque Français (ERAF)', 'L''Escadron de Reconnaissance et d''Attaque Français (ERAF) est un escadron virtuel (DCS) constitué de 5 escadrilles et 1 flottille. Dans l''escadron, il y a toutes sortes de profils, des jeunes aux plus…', 'L''Escadron de Reconnaissance et d''Attaque Français (ERAF) est un escadron virtuel (DCS) constitué de 5 escadrilles et 1 flottille. Dans l''escadron, il y a toutes sortes de profils, des jeunes aux plus âgés, des pilotes expérimentés aux novices, mais ce qui nous unit tous, c''est la passion pour le vol et l''aéronautique.', 'L''objectif de l''ERAF est de réunir des passionnés autour d''une même passion commune et de proposer des événements accessibles à tous, peu importe le niveau de chacun.', '/commus_img/eraf.png', 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'monthly'::event_frequency, 'Squeegee', 'FanBoy (Discord : fanboy9983)', '- Savoir utiliser un minimum le module et avoir au moins 14 ans.', 'Moyenne Taille (+30 pilotes)', 'https://discord.gg/ucD3ccF4g7', 'https://escadron-eraf.webador.fr/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'eraf' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'eraf' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'eraf';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'eraf';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'eraf';

-- ── Community: École de Simulation de Combat Aérien (ESCA) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('esca', 'École de Simulation de Combat Aérien (ESCA)', 'École sur Mirage 2000C, UH-1H Huey, A-10C II, et bien d''autres modules, 100% gratuite et accessible à tous !', 'École sur Mirage 2000C, UH-1H Huey, A-10C II, et bien d''autres modules, 100% gratuite et accessible à tous !', 'Les objectifs de l''ESCA est de former tous les pilotes sans condition de niveau sur les modules proposés à la formation par l''école, réunir une communauté de joueurs francophones et leur permettre de prendre part à des missions passionnantes tous ensemble !', '/commus_img/esca.png', 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'very_active'::event_frequency, 'Killight', 'email - esca.team.fr@gmail.com', '- Aucune condition d''entrée, ouvert à tous', 'Moyenne Taille (+30 pilotes)', NULL, 'https://forum.esca-team.fr/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'esca' AND m.name = 'UH-1' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Aerobatics' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Meetings Aériens Virtuels' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'esca' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'esca';

-- ── Community: Flying Buddies ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('fb', 'Flying Buddies', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/UKDpJZhsCe', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'fb';

-- ── Community: FOX3 ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('fox3', 'FOX3', NULL, NULL, NULL, '/commus_img/fox3.jpg', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/rTJbR87fBv', NULL, 'https://www.youtube.com/c/Fox3DCS_Squadron', 'https://www.instagram.com/fox3.dcs', NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'fox3';

-- ── Community: FR3D Studio ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('fr3d', 'FR3D Studio', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/xXnqdBTE2J', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'fr3d';

-- ── Community: EC 2/18 Frelon ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('frelon', 'EC 2/18 Frelon', 'BzzzzBzzzz (en Français) 🐝', 'BzzzzBzzzz (en Français) 🐝', NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/59GjBhpRkQ', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'frelon';

-- ── Community: GamePlan ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('gameplan', 'GamePlan', 'Bienvenue sur le discord GamePlan ! Ce salon a été créé pour promouvoir un nouveau format PvP sur DCS. Dénommé Gameplan, ce format a pour but de trancher avec les oppositions BVR habituelles et oppose…', 'Bienvenue sur le discord GamePlan ! Ce salon a été créé pour promouvoir un nouveau format PvP sur DCS. Dénommé Gameplan, ce format a pour but de trancher avec les oppositions BVR habituelles et oppose deux équipes dans un engagement asymétrique et proposant des objectifs au sol, le tout avec une légère composante wargame pour le choix des avions. Il conviendra aux pilotes souhaitant voler dans un esprit tactique et réaliste.', 'Ce format a pour but de trancher avec les oppositions BVR habituelles et oppose deux équipes dans un engagement asymétrique et proposant des objectifs au sol, le tout avec une légère composante wargame pour le choix des avions. Il conviendra aux pilotes souhaitant voler dans un esprit tactique et réaliste.', '/commus_img/gameplan.png', 'large_50_plus'::size_category, 'event_only'::community_type, 'none'::recruitment_status, 'weekly'::event_frequency, 'Fenrir', 'Fenrir (discord : fenrir50)', 'Aucune particulière, plus d''infos sur le discord.', 'Grande Taille (+50 pilotes)', 'https://discord.gg/RMHbJapcru', NULL, 'https://www.youtube.com/watch', NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gameplan' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gameplan' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gameplan' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gameplan' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gameplan' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gameplan' AND m.name = 'Flaming Cliffs' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gameplan' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gameplan' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'gameplan';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'gameplan';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'gameplan';

-- ── Community: Groupement de Chasse 22 ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('gc22', 'Groupement de Chasse 22', 'Les aventures d''un groupe de copains sur DCS World.', 'Les aventures d''un groupe de copains sur DCS World.', 'S''amuser entre potes tout en respectant un certain réalisme de vol/missions', '/commus_img/gc22.jpg', 'medium_30_plus'::size_category, 'closed_squadron'::community_type, 'open'::recruitment_status, 'weekly'::event_frequency, 'Psyko/Cef/Grizz', 'STARFOX', 'Nous écrire un mail expliquant vos motivations à nous rejoindre via notre chaîne YouTube', 'Moyenne Taille (+30 pilotes)', NULL, NULL, 'https://youtube.com/@groupementdechasse2273', NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Combined Arms' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Flaming Cliffs' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Ka-50' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Mi-24' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Mi-8' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'SA-342' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'gc22' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'gc22' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'gc22';

-- ── Community: IRREductibles ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('irre', 'IRREductibles', 'Nous sommes une communauté de passionnés d''aviation et de simulation de vol fondée en 2013.', 'Nous sommes une communauté de passionnés d''aviation et de simulation de vol fondée en 2013.
Au fil des années nous avons développé une structure solide autour de notre forum, une école de combat WWII, des missions PvE et des campagnes ainsi que des événements inter-escadrilles.
Nous hébergeons nos missions, campagnes et cartes écoles sur notre propre serveur, tout en organisant des sorties sur serveurs publiques.', NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/JhhWvnSFHs', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'irre';

-- ── Community: Joint Task Force Francophone (JTFF) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('jtff', 'Joint Task Force Francophone (JTFF)', 'Le Joint Task Force Francophone est un rassemblement de Squadrons, chacun étant spécifiquement dédié à un appareil ; F/A 18C, F-16 Bck 50, Mirage 2000-C, Mirages F1, F-15 E, F14 A & B.', 'Le Joint Task Force Francophone est un rassemblement de Squadrons, chacun étant spécifiquement dédié à un appareil ; F/A 18C, F-16 Bck 50, Mirage 2000-C, Mirages F1, F-15 E, F14 A & B.

L''ambition et le but de cette escadrille, est de créer un rassemblement de pilotes, confirmés, mais en vue d''un aspect opérationnel complètement Mil-sim, et j''insiste sur ce dernier mot. Rigueur, procédures, stratégies, contraintes spatiotemporelles & logistiques accrues, tels seront les facteurs principaux des missions inter-escadrons.

Le Joint Task Force Francophone est donc un regroupement d’escadrons dédiés & spécifiques par appareils, travaillant ensembles.

Nous avons aujourd’hui, 6 escadrons ouverts, listés par appareil ;

- **79TH FS « Tigers »** évoluant sur F-16 Bck. 50.

- **494TH FS « Panther »** évoluant sur F-15E.

- **E.C. 2/5 « Ile de France»** évoluant sur Mirage 2000-C

- **E.R. 2/33 « Savoie »** évoluant sur Mirage F1

Ainsi qu’une **Carrier Air Wing**, regroupant toute l’aéronavale du JTFF, disposée de la sorte ;

- **VF84 « Jolly Rogers »** évoluant sur F-14B Tomcat.

- **VMFA 314 « Black Knights »** évoluant sur F/A-18C Hornet.

En cas de projet ou de proposition pour un escadron pas encore représenté à la JTFF, n’hésitez pas à rejoindre notre discord et à prendre contact avec Marco ou Zanck pour en discuter.

Vous retrouverez, tous les détails relatifs à chacun dans l’onglet « Nos Escadrilles » sur le [site officiel](https://jtff.fr/SITE/).', NULL, '/commus_img/jtff.png', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/2dzfwvNWby', 'https://jtff.fr/SITE/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'jtff';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/jtff/jtff1.png', 'Joint Task Force Francophone (JTFF) - Image 1', 0 FROM communities c WHERE c.slug = 'jtff';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/jtff/jtff2.png', 'Joint Task Force Francophone (JTFF) - Image 2', 1 FROM communities c WHERE c.slug = 'jtff';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/jtff/jtff3.png', 'Joint Task Force Francophone (JTFF) - Image 3', 2 FROM communities c WHERE c.slug = 'jtff';

-- ── Community: Killer Aggressor Squadron ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('kas', 'Killer Aggressor Squadron', 'Le Killer Aggressor Squadron est un squadron aggresseur basé sur le F-16C. Nous avons pour but de pratiquer des procédures en équipe. Le squadron est ouvert à tous, il faut passer par la FWS (Fighter …', 'Le Killer Aggressor Squadron est un squadron aggresseur basé sur le F-16C. Nous avons pour but de pratiquer des procédures en équipe. Le squadron est ouvert à tous, il faut passer par la FWS (Fighter Weapons School), passer la qualification et enfin le squadron.', NULL, '/commus_img/kas.png', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/ADseKTyZzN', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'kas';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/kas/background.png', 'Killer Aggressor Squadron - Image 1', 0 FROM communities c WHERE c.slug = 'kas';

-- ── Community: Kerboulistan (Opés de Kerboul) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('kerboul', 'Kerboulistan (Opés de Kerboul)', 'Le Kerboulistan, également connu sous le nom d''Opés de Kerboul, sert de centre opérationnel pour les activités de Kerboul. La majorité des activités proposées ont un impact étendu sur la Communauté DC…', 'Le Kerboulistan, également connu sous le nom d''Opés de Kerboul, sert de centre opérationnel pour les activités de Kerboul. La majorité des activités proposées ont un impact étendu sur la Communauté DCS Francophone, avec des événements de portée nationale, voire internationale. Le groupe peut se targuer d''un palmarès comprenant de multiples événements, tels que l''Operation Endgame, qui dépassent souvent la centaine de participants. La philosophie du groupe est de concevoir des événements et des scénarios de jeu au moyen de DCS World, tout en repoussant les limites du simulateur au maximum. Cela inclut la création de terrains de jeu dynamiques, l''engagement au sol en plus des combats aériens, et une mise en avant particulière du travail d''équipe et de la planification dans un environnement de jeu compétitif.', 'Nous aspirons à offrir des expériences de missions et de jeu avec un niveau de réalisme variable. Pour nous, le plaisir et l''immersion prédominent sur la simple réalité, considérant DCS comme un jeu bac à sable plutôt qu''un simulateur strict. Cela n''empêche en rien l''organisation de missions et d''événements à forts enjeux et très réalistes.', '/commus_img/kerboul.png', 'hub_300_plus'::size_category, 'open_community'::community_type, 'none'::recruitment_status, 'weekly'::event_frequency, 'Kerboul (Lead)', 'Kerboul', 'Aucune !', 'Hubs de la Communauté (+300 Membres)', 'https://discord.gg/YqJhmGgxNp', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'kerboul' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'kerboul' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'kerboul';

-- ── Community: Liaison 16 (L16) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('l16', 'Liaison 16 (L16)', 'Liaison 16 (L16) est un escadron francophone créé il y a plus de 3 ans. Répartis par escadrilles volant sur le même appareil, leur objectif est de pousser la simulation toujours plus loin et de repous…', 'Liaison 16 (L16) est un escadron francophone créé il y a plus de 3 ans. Répartis par escadrilles volant sur le même appareil, leur objectif est de pousser la simulation toujours plus loin et de repousser les limites de leurs modules. Ils mettent en place des serveurs d''entraînement dédiés 24h/24h et insistent sur la bonne ambiance et l''esprit de solidarité. De plus, une mission intra-escadron est organisée chaque samedi soir à 21H00 chaque semaine.', 'Repousser les limites de leurs modules.', '/commus_img/l16_1.png', 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'weekly'::event_frequency, 'Lil Bob', 'l16chouca', 'Motivation et Passion.', 'Moyenne Taille (+30 pilotes)', 'https://discord.gg/XTdYajXJmd', NULL, 'https://www.youtube.com/watch', 'https://www.instagram.com/liaison_16_francophone', NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'l16' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'l16' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'l16' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'l16' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'l16' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'l16' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'l16' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'l16';

-- ── Community: Leading Edge (LD_E) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('lde', 'Leading Edge (LD_E)', 'Un escadron au style "Saucisson/Rillette" constitué de pilotes de la "Chair Force". Bien que nous ne visons pas le MilSim, nous maintenons un niveau de sérieux pendant nos vols. Nos créateurs de missi…', 'Un escadron au style "Saucisson/Rillette" constitué de pilotes de la "Chair Force". Bien que nous ne visons pas le MilSim, nous maintenons un niveau de sérieux pendant nos vols. Nos créateurs de missions sont à l''écoute et apportent toujours des idées originales. Il y en a pour tous les goûts ! (Réservé aux personnes de plus de 18 ans)', 'Notre objectif est simplement de passer du temps à refaire le monde, apprendre les uns des autres, et consacrer une partie de notre temps à une passion commune.', '/commus_img/LDE.png', 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'very_frequent'::event_frequency, 'LaCrepe_', 'LaCrepe_, zozo_007', 'Le discord est public, l''entrée dans l''escadron se fait sur demande et si le feeling passe bien. Pas de tests d''entrée, juste être dans l’esprit.', 'Moyenne Taille (+30 pilotes)', 'https://discord.gg/abmwjqnwht', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'lde' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'lde' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_early'::historical_period FROM communities c WHERE c.slug = 'lde';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_mid'::historical_period FROM communities c WHERE c.slug = 'lde';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_late'::historical_period FROM communities c WHERE c.slug = 'lde';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'lde';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'lde';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'lde';

-- ── Community: 51th Massilia ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('massilia', '51th Massilia', 'La 51th Massilia représente d’abord un ensemble de personnes passionnées de simulation de vol militaire.', 'La 51th Massilia représente d’abord un ensemble de personnes passionnées de simulation de vol militaire.

Ayant une existence online, nous privilégions néanmoins des rencontres de type LAN. Ceux-ci s’effectuent en moyenne toutes les six semaines et durent deux jours (et quasiment deux nuits).

Ces LAN s’effectuent à Marseille dans un local spécialement emménagé pour cela (nommé le Garage).

La grande villa qui héberge « le Garage » permet  de manger et dormir sur place.

Nous volons actuellement et selon les LANs sur DCS, Falcon 4 BMS, ainsi que Battle of Stalingrad.', NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/VkK6bMDY', 'http://51thmassilia.net/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'massilia';

-- ── Community: NOeZ ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('noez', 'NOeZ', 'La NOeZ est un groupe francophone dédié au MILSIM Lite, multimodule, ayant pour objectif de créer des escadrons variés et des opérations basées sur le réel ou l''imaginaire.', 'La NOeZ est un groupe francophone dédié au MILSIM Lite, multimodule, ayant pour objectif de créer des escadrons variés et des opérations basées sur le réel ou l''imaginaire.', 'Aucune précision particulière n''est requise; l''esprit de la NOeZ est ouvert et décalé. Nous sommes là pour nous amuser tout en adoptant une approche sérieuse.', '/commus_img/noez.png', 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'very_frequent'::event_frequency, 'les Fondateur de la NOeZ (Lead)', '[VFA-87] Tiger / [VF-142 NOeZ] Igor.O / [157th FS] Justice / [204th TFS] Phenex / [RC 2/30] Zemouton / [391St ftr]Yirro', 'Connaître son module de manière minimale à moyenne, et être disponible à moyen et long terme.', 'Moyenne Taille (+30 pilotes)', 'https://discord.gg/5Eqw2yg7vd', NULL, NULL, 'https://instagram.com/dcs_world_noescapezone', NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'noez' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'noez' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_late'::historical_period FROM communities c WHERE c.slug = 'noez';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'noez';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'noez';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'noez';

-- ── Community: Raybirds ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('raybirds', 'Raybirds', 'Bien le bonjour et Bienvenue sur ton serveur RayBirds, ici, pas de prise de tête, communauté d''une 50e de personnes tous sympathiques et à l''écoute on est principalement sur DCS même si nous sommes ou…', 'Bien le bonjour et Bienvenue sur ton serveur RayBirds, ici, pas de prise de tête, communauté d''une 50e de personnes tous sympathiques et à l''écoute on est principalement sur DCS même si nous sommes ouverts à d''autres jeux (Arma, ACC etc.) alors n''hésite pas si tu veux jouer/voler dans la bonne humeur et la rigolade et te perfectionner !', NULL, '/commus_img/raybirds/raybirds_b.png', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/QBGgC3Df2G', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'raybirds';

-- ── Community: RELAX ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('relax', 'RELAX', 'Salut à tous, ce serveur Discord vise à rassembler les joueurs francophones évoluant en PvP sur DCS avec des warbirds. Le canal 📰-planning-de-vol sert à communiquer les dates et heures de nos sorties…', 'Salut à tous, ce serveur Discord vise à rassembler les joueurs francophones évoluant en PvP sur DCS avec des warbirds. Le canal 📰-planning-de-vol sert à communiquer les dates et heures de nos sorties. N''oubliez pas de mentionner @WW2 Squad lors de vos propositions. Aucune sortie n''est obligatoire, mais si vous vous engagez, veuillez respecter votre engagement envers les pilotes qui se sont rendus disponibles. Le Discord s''appelle Relax, et c''est également notre état d''esprit. Nous sommes là pour apprendre, progresser, tout en passant un bon moment. Bon vol à tous !', 'Ce serveur Discord a pour objectif de rassembler les joueurs francophones volant sur warbirds en PvP sur DCS.', '/commus_img/relax.webp', 'large_50_plus'::size_category, 'semi_open_squadron'::community_type, 'none'::recruitment_status, 'very_frequent'::event_frequency, 'Cino', 'Cino (discord : cino_relax)', 'Aucune', 'Grande Taille (+50 pilotes)', 'https://discord.gg/XZkQYGbnxF', NULL, NULL, NULL, NULL, 'https://twitch.tv/cino_relax', NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'relax' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'relax' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'relax' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'relax' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'relax' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'relax' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'relax' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Aerobatics' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'relax' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'ww2'::historical_period FROM communities c WHERE c.slug = 'relax';

-- ── Community: Swiss Alpine Fighters (SAF) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('saf', 'Swiss Alpine Fighters (SAF)', 'Groupe Suisse et francophone volant dans la joie et la bonne humeur, se retrouvant principalement les soirs et le week-end pour de sympathiques missions en inter-escadrille ou tout simplement en volan…', 'Groupe Suisse et francophone volant dans la joie et la bonne humeur, se retrouvant principalement les soirs et le week-end pour de sympathiques missions en inter-escadrille ou tout simplement en volant sur notre serveur dédié. A disposition une mission de training air/air air/sol air/mer ainsi qu''un scénario original. Entraide, maturité, et bonne ambiance.', 'Inter-escadrille, PVE et bientôt PVP.', '/commus_img/saf.png', 'medium_under_30'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'monthly'::event_frequency, 'Zarma', 'Zarma, BlackCrows, sur discord principalement', '- Bonne humeur, un minimum de sérieux, SRS et Discord.', 'Moyenne Taille (<30 pilotes)', 'https://discord.gg/YbJJ7fbXmR', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'Combined Arms' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'Ka-50' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'UH-1' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'AH-64D' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'Combined Arms' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'saf' AND m.name = 'UH-1' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Aerobatics' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Campagnes Dynamiques (DSMC/Liberation)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Meetings Aériens Virtuels' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Tournois (Dogfight/BVR/etc)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'saf' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'saf';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'saf';

-- ── Community: DCS Screenshots World ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('screens', 'DCS Screenshots World', 'Bienvenue sur le serveur DCS Screenshots World, un espace dédié exclusivement au partage de captures d''écran ainsi qu''à l''entraide pour les configurations et paramètres de DCS World.', 'Bienvenue sur le serveur DCS Screenshots World, un espace dédié exclusivement au partage de captures d''écran ainsi qu''à l''entraide pour les configurations et paramètres de DCS World.', NULL, '/commus_img/screenshot_world.png', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/AwNRRwj5qj', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'screens';

-- ── Community: Sky Haven ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('skyhaven', 'Sky Haven', 'Sky Haven est un serveur Discord et DCS conçu comme un bar ouvert à tous, sans affiliation à un escadron ou groupe. Les règles s''appliquent à tous les membres, qu''ils soient des habitués ou des visite…', 'Sky Haven est un serveur Discord et DCS conçu comme un bar ouvert à tous, sans affiliation à un escadron ou groupe. Les règles s''appliquent à tous les membres, qu''ils soient des habitués ou des visiteurs occasionnels. Le serveur DCS est disponible presque 24/7, mais des interventions peuvent être nécessaires. Les membres peuvent s''abonner aux rôles via 📲notif et suivre les mises à jour via live🔴 et updates🧾. Pour les questions ou problèmes, il est recommandé d''utiliser les canaux publics. Profitez de votre expérience ! 🚀✈️', 'Offrir un serveur à disposition du public pour différents usages.', '/commus_img/skyhaven.webp', 'hub_300_plus'::size_category, 'open_community'::community_type, 'none'::recruitment_status, 'very_active'::event_frequency, 'Asta', 'asta (Discord : astazou)', 'Aucune', 'Hubs de la Communauté (+300 Membres)', 'https://discord.gg/AGRKs4vqeB', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'skyhaven' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'skyhaven' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'skyhaven';

-- ── Community: Split Air ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('splitair', 'Split Air', 'La Split-Air est une équipe orientée voltige aérienne qui présente ses patrouilles et ses mods sur des évènements virtuels. Descendante de la team « WolfDelta », elle a le souhait de développer au mie…', 'La Split-Air est une équipe orientée voltige aérienne qui présente ses patrouilles et ses mods sur des évènements virtuels. Descendante de la team « WolfDelta », elle a le souhait de développer au mieux ses mods qui serviront ensuite dans les patrouilles. La plupart des mods sont publics, le RAF, Mirage 2000N/D et OV-10A Bronco sont disponibles au téléchargement sur le site de la Split-Air. L''Alphajet est toujours en développement et devrait voir le jour prochainement.', 'Représenter le savoir-faire français en matière de voltige aérienne. La Split-Air développe des mods pour la communauté DCS, forme des pilotes qui veulent goûter aux plaisirs de la voltige afin de participer aux airshows comme le VIAF. Elle envoie chaque année ses meilleures équipes (Voltige Victor, Couteau Delta...).', '/commus_img/splitair.png', 'hub_300_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'weekly'::event_frequency, 'Tom', 'tom83400 (discord)', 'Aucune ! On vous attend en vocal et en vol. 😃', 'Hubs de la Communauté (+300 Membres)', 'https://discord.gg/cRh9PFMwWP', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'splitair' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'splitair' AND e.name = 'Meetings Aériens Virtuels' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'splitair' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'splitair' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'splitair' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'splitair';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/splitair/split1.png', 'Split Air - Image 1', 0 FROM communities c WHERE c.slug = 'splitair';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/splitair/split2.png', 'Split Air - Image 2', 1 FROM communities c WHERE c.slug = 'splitair';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/splitair/split3.png', 'Split Air - Image 3', 2 FROM communities c WHERE c.slug = 'splitair';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/splitair/split4.png', 'Split Air - Image 4', 3 FROM communities c WHERE c.slug = 'splitair';
INSERT INTO community_images (community_id, url, alt, sort_order) SELECT c.id, '/commus_img/splitair/split5.png', 'Split Air - Image 5', 4 FROM communities c WHERE c.slug = 'splitair';

-- ── Community: TheSkyline35 ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('ts35', 'TheSkyline35', 'Ingénieur et pilote privé.', 'Ingénieur et pilote privé.
Bienvenue aux fans d''aviations virtuelles comme réelles ! 
Je suis très orienté chasse et donc simulateurs "militaires", mais on touche à tout, et j''ai un passif de liner sous FSX !', NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/5JVEwYxKJ7', NULL, 'https://www.youtube.com/@TheSkyline35', NULL, NULL, NULL, 'https://twitter.com/Thesk', true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'ts35';

-- ── Community: Aerobatics Prestige (VAP) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('vap', 'Aerobatics Prestige (VAP)', 'Aerobatics Prestige est une école de pilotage virtuelle visant à partager son expérience et son savoir-faire sur divers domaines de l’aviation civile et militaire. Ils offrent des formations gratuites…', 'Aerobatics Prestige est une école de pilotage virtuelle visant à partager son expérience et son savoir-faire sur divers domaines de l’aviation civile et militaire. Ils offrent des formations gratuites au pilotage conçues par leurs instructeurs, couvrant les bases pour les débutants, l''approfondissement des connaissances pour les pilotes plus expérimentés, et la découverte de nouvelles compétences pour tous.', 'Organiser des meetings aériens, créer et développer des patrouilles de voltige.', '/commus_img/vap.png', 'medium_30_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'very_frequent'::event_frequency, 'Pludimix', 'pludimix (Discord)', 'Aucune condition pour entrer sur le serveur, mais pour rejoindre un escadron, il est demandé de se présenter auprès des membres.', 'Moyenne Taille (+30 pilotes)', 'https://discord.gg/V5SyVZxgTt', NULL, 'https://www.youtube.com/channel/UCHWZ3zRYWe66IVaa7sxBurA', 'https://www.instagram.com/aerobaticsprestige', 'https://www.facebook.com/profile.php', 'https://www.twitch.tv/aerobatics_prestige', NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'A-10A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'A-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'AJS-37' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'AV-8B' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'C-101' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'F-14' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'F-15C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'F-86' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'JF-17' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'L-39' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'MB-339' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'MiG-15' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'MiG-19' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'Su-25A' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'Su-25T' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'Su-27' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'Su-33' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'BF-109' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'FW-190' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'I-16' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'P-51D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vap' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Aerobatics' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Meetings Aériens Virtuels' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vap' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'vap';

-- ── Community: Virtual Belgian Air Force (VBAF) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('vbaf', 'Virtual Belgian Air Force (VBAF)', 'Bienvenue à la Virtual Belgian Air Force ! Nous sommes un groupe composé essentiellement de Belges (francophones et néerlandophones), mais nous acceptons évidemment les personnes de toutes nationalité…', 'Bienvenue à la Virtual Belgian Air Force ! Nous sommes un groupe composé essentiellement de Belges (francophones et néerlandophones), mais nous acceptons évidemment les personnes de toutes nationalités qui souhaitent se joindre à notre aventure. Nous disposons de 6 escadrilles, dont 4 évoluent sur F-16, divisées en 2 groupes francophones et néerlandophones. Nous avons également une escadrille F-16 supplémentaire dédiée à la formation des nouveaux pilotes, où vous pourrez parler votre langue maternelle si l''instructeur le permet. Enfin, une escadrille évolue sur le mod Hercules avant de passer au module officiel. Nous proposons un serveur ouvert 24/7 avec plus de 15 presets météo et organisons d''autres missions en parallèle.', '- Formation de base sur F-16
  - Formation sur la phraséologie en anglais dans un espace immersif mais tranquille
  - Coopération avec d''autres groupes pour des missions
  - Organisation d''évènements originaux', '/commus_img/vbaf.png', 'large_50_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'weekly'::event_frequency, 'Reaper avec le Callsign supplémentaire "Rizzler"', 'Reaper, trouvable sur Discord en ajoutant @rizzlervbaf', '- Avoir des bases en anglais
  - Être motivé
  - Posséder le module DCS: F-16C ou le mod Hercules
  - Un minimum de sérieux', 'Grande Taille (+50 pilotes)', 'https://discord.gg/mjVqwGSzfV', NULL, NULL, 'https://www.instagram.com/dcsvbaf', NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vbaf' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vbaf' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vbaf' AND m.name = 'C-130' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'vbaf' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'vbaf' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'vbaf';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'early_modern'::historical_period FROM communities c WHERE c.slug = 'vbaf';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'vbaf';

-- ── Community: VEAF (Virtual European Air Force) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('veaf', 'VEAF (Virtual European Air Force)', 'L''association Virtual European Air Force (VEAF) se consacre au développement de la simulation de vol de combat ludique. Elle réunit des passionnés d''aviation de combat, offrant à ses membres une avent…', 'L''association Virtual European Air Force (VEAF) se consacre au développement de la simulation de vol de combat ludique. Elle réunit des passionnés d''aviation de combat, offrant à ses membres une aventure humaine moderne et immersive.', '- Développement du contrôle d''interception (GCI)
  - Contrôle local d''aérodrome
  - Amélioration des simulateurs de vol
  - Promotion et accessibilité de la simulation de vol de combat', '/commus_img/veaf.png', 'very_large_150_plus'::size_category, 'semi_open_squadron'::community_type, 'open'::recruitment_status, 'very_active'::event_frequency, 'Couby', 'Sur notre Discord: Tipiak, Ti''Rco, The Reaper, Jed', '- Aucune condition pour les activités publiques.
  - Pour accéder aux activités privées, rejoindre l''association et s''acquitter de la cotisation.', 'Très Grande Taille (+150 pilotes)', NULL, 'https://www.veaf.org', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'F-15E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'Mi-24' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'Mi-8' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'MiG-21' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'Mosquito' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'P-47D' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'Spitfire' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'A-10C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaf' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Escadron Multi-Branches' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaf' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'veaf';

-- ── Community: 4th VEAW (4th Virtual Expeditionary Air Wing) ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('veaw', '4th VEAW (4th Virtual Expeditionary Air Wing)', 'La 4th Virtual Expeditionary Air Wing (4th VEAW) est un regroupement d''escadrons de combat virtuels évoluant sur DCS World. Ils se concentrent sur des missions et campagnes immersives situées dans le …', 'La 4th Virtual Expeditionary Air Wing (4th VEAW) est un regroupement d''escadrons de combat virtuels évoluant sur DCS World. Ils se concentrent sur des missions et campagnes immersives situées dans le contexte de la Guerre Froide tardive et de la Guerre du Golfe, en utilisant des tactiques et procédures réalistes.', '- Effectuer des missions et campagnes immersives historiquement inspirées
  - Utiliser des tactiques et procédures réalistes dans les opérations', '/commus_img/veaw.png', 'medium_30_plus'::size_category, 'closed_squadron'::community_type, 'open'::recruitment_status, 'weekly'::event_frequency, 'Voodoo / Noiser', 'Voodoo / Noiser', '- Connaissance de l''appareil (au minimum les bases)
  - Capacité à voler en formation
  - Engagement à respecter les procédures et tactiques définies par le groupe', 'Moyenne Taille (+30 pilotes)', 'https://discord.com/invite/UXHPDtcEES', 'https://veaw4.fr/', NULL, NULL, 'https://www.facebook.com/veaw4', NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'Mi-24' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'Mi-8' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'F-4E' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'MiG-29' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'Mirage F1' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'F-5E' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'Mi-24' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'veaw' AND m.name = 'Mi-8' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Formations à la Phraséo/Communication (SRS)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Présence d''AWACS Humains (Avec/Sans LotATC)' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'veaw' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'cold_war_late'::historical_period FROM communities c WHERE c.slug = 'veaw';
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'gulf_war'::historical_period FROM communities c WHERE c.slug = 'veaw';

-- ── Community: Duck's Squadron ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('vfa12', 'Duck''s Squadron', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/d6XZzXFG', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'vfa12';

-- ── Community: 64 vFAS ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('vfas', '64 vFAS', NULL, NULL, NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/QF4J2Ts3As', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'vfas';

-- ── Community: DCS Vietnam War : L'Expérience Historique ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('vietnam', 'DCS Vietnam War : L''Expérience Historique', NULL, NULL, NULL, '/commus_img/vietnam.webp', 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/hknj5v6PgM', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'vietnam';

-- ── Community: 71 WASP ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('wasp', '71 WASP', 'BzzzzBzzzz (avec un accent Anglais) 🐝', 'BzzzzBzzzz (avec un accent Anglais) 🐝', NULL, NULL, 'unknown'::size_category, 'other'::community_type, 'unknown'::recruitment_status, 'unknown'::event_frequency, NULL, NULL, NULL, NULL, 'https://discord.gg/rEvvCQTFwD', NULL, NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'none'::historical_period FROM communities c WHERE c.slug = 'wasp';

-- ── Community: Wolfa - Virtual Pilots Corporation ──
INSERT INTO communities (slug, name, short_description, description, objectives, logo_url, size_category, community_type, recruitment_status, event_frequency, founder, contact, entry_conditions, size_text, discord_url, website_url, youtube_url, instagram_url, facebook_url, twitch_url, twitter_url, published, featured)
VALUES ('wolfa', 'Wolfa - Virtual Pilots Corporation', 'La Wolfa - Virtual Pilots Corporation est une communauté de pilotes virtuels passionnés évoluant principalement sur DCS World (Open Beta). Fondée par CrashTest, un leader expérimenté, la Wolfa se dist…', 'La Wolfa - Virtual Pilots Corporation est une communauté de pilotes virtuels passionnés évoluant principalement sur DCS World (Open Beta). Fondée par CrashTest, un leader expérimenté, la Wolfa se distingue par son engagement à fournir des expériences de vol réalistes et immersives sur les théâtres d’opérations modernes.', '- Proposer des vols réalistes et immersifs sur DCS World
  - Participer à des opérations modernes avec réalisme
  - Collaborer avec d''autres escadrilles pour des missions et événements', '/commus_img/wolfa.jpeg', 'medium_30_plus'::size_category, 'closed_squadron'::community_type, 'open'::recruitment_status, 'very_frequent'::event_frequency, 'CrashTest (Lead)', 'Crashtest', 'Les conditions d''entrée sont détaillées sur [notre site web](http://www.wolfa.fr/).', 'Moyenne Taille (+30 pilotes)', 'https://discord.gg/NWCjCKpenU', 'http://www.wolfa.fr/', NULL, NULL, NULL, NULL, NULL, true, false)
ON CONFLICT (slug) DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'wolfa' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'wolfa' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'wolfa' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'wolfa' AND m.name = 'F-16C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'wolfa' AND m.name = 'F/A-18C' ON CONFLICT DO NOTHING;
INSERT INTO community_sought_modules (community_id, module_id) SELECT c.id, m.id FROM communities c, modules m WHERE c.slug = 'wolfa' AND m.name = 'M2000-C' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Communauté dédiée aux Débutants' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Communauté dédiée aux confirmés/pilotes aguerris' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Compétitions Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Entraînements pour Inscrits' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Entraînements pour Public' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Missions Arcade/Fun' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Missions MILSIM Lite' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Missions MILSIM++' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Présence Tuteurs pour Modules' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Présence d''un Serveur Dédié 24/7' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Présence d''un Serveur Dédié à la demande' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Rôle : ANTISHIP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Rôle : CAP' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Rôle : CAS' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Rôle : SEAD' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Rôle : STRIKE' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Rôle : RECON' ON CONFLICT DO NOTHING;
INSERT INTO community_experiences (community_id, experience_id) SELECT c.id, e.id FROM communities c, experiences e WHERE c.slug = 'wolfa' AND e.name = 'Événements Inter-Communautaires' ON CONFLICT DO NOTHING;
INSERT INTO community_historical_periods (community_id, period) SELECT c.id, 'post_modern'::historical_period FROM communities c WHERE c.slug = 'wolfa';

COMMIT;

-- Summary: 54 communities from 54 files