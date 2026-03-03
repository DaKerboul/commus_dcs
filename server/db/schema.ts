import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Enums ──────────────────────────────────────────────

export const sizeCategoryEnum = pgEnum('size_category', [
  'hub_300_plus',
  'very_large_150_plus',
  'large_50_plus',
  'medium_30_plus',
  'medium_under_30',
  'small',
  'unknown',
])

export const communityTypeEnum = pgEnum('community_type', [
  'semi_open_squadron',
  'closed_squadron',
  'open_community',
  'event_only',
  'esport_team',
  'content_creator',
  'mod_development',
  'screenshot_community',
  'atc_community',
  'other',
])

export const recruitmentStatusEnum = pgEnum('recruitment_status', [
  'open',
  'closed',
  'none',
  'unknown',
])

export const eventFrequencyEnum = pgEnum('event_frequency', [
  'very_active',      // + de 3 par semaine
  'very_frequent',    // + d'1 par semaine
  'weekly',           // 1 chaque semaine
  'biweekly',         // 1 toutes les 2 semaines
  'monthly',          // 1 par mois
  'occasional',       // < 1 par mois
  'unknown',
])

export const historicalPeriodEnum = pgEnum('historical_period', [
  'ww2',
  'cold_war_early',
  'cold_war_mid',
  'cold_war_late',
  'gulf_war',
  'early_modern',
  'post_modern',
  'none',
])

export const submissionStatusEnum = pgEnum('submission_status', [
  'pending',
  'approved',
  'rejected',
])

// ── Tables ─────────────────────────────────────────────

export const communities = pgTable('communities', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  objectives: text('objectives'),
  logoUrl: text('logo_url'),

  // Enums
  sizeCategory: sizeCategoryEnum('size_category').default('unknown'),
  communityType: communityTypeEnum('community_type').default('other'),
  recruitmentStatus: recruitmentStatusEnum('recruitment_status').default('unknown'),
  eventFrequency: eventFrequencyEnum('event_frequency').default('unknown'),

  // Structured fields
  founder: varchar('founder', { length: 255 }),
  contact: varchar('contact', { length: 255 }),
  entryConditions: text('entry_conditions'),
  sizeText: varchar('size_text', { length: 255 }),

  // Links
  discordUrl: text('discord_url'),
  websiteUrl: text('website_url'),
  youtubeUrl: text('youtube_url'),
  instagramUrl: text('instagram_url'),
  facebookUrl: text('facebook_url'),
  twitchUrl: text('twitch_url'),
  twitterUrl: text('twitter_url'),
  otherLinks: jsonb('other_links').$type<{ label: string; url: string }[]>(),

  // Meta
  featured: boolean('featured').default(false),
  published: boolean('published').default(true),
  votes: integer('votes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const modules = pgTable('modules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }), // 'western_fixed', 'eastern_fixed', 'helicopter', 'ww2', 'other'
  iconUrl: text('icon_url'),
})

export const experiences = pgTable('experiences', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  icon: varchar('icon', { length: 50 }),
})

export const communityModules = pgTable('community_modules', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
})

export const communitySoughtModules = pgTable('community_sought_modules', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
})

export const communityExperiences = pgTable('community_experiences', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  experienceId: integer('experience_id').notNull().references(() => experiences.id, { onDelete: 'cascade' }),
})

export const communityHistoricalPeriods = pgTable('community_historical_periods', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  period: historicalPeriodEnum('period').notNull(),
})

export const communityImages = pgTable('community_images', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: varchar('alt', { length: 255 }),
  sortOrder: integer('sort_order').default(0),
})

export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  communityName: varchar('community_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  discordUrl: text('discord_url'),
  websiteUrl: text('website_url'),
  description: text('description'),
  status: submissionStatusEnum('status').default('pending'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ── Relations ──────────────────────────────────────────

export const communitiesRelations = relations(communities, ({ many }) => ({
  modules: many(communityModules),
  soughtModules: many(communitySoughtModules),
  experiences: many(communityExperiences),
  historicalPeriods: many(communityHistoricalPeriods),
  images: many(communityImages),
}))

export const communityModulesRelations = relations(communityModules, ({ one }) => ({
  community: one(communities, { fields: [communityModules.communityId], references: [communities.id] }),
  module: one(modules, { fields: [communityModules.moduleId], references: [modules.id] }),
}))

export const communitySoughtModulesRelations = relations(communitySoughtModules, ({ one }) => ({
  community: one(communities, { fields: [communitySoughtModules.communityId], references: [communities.id] }),
  module: one(modules, { fields: [communitySoughtModules.moduleId], references: [modules.id] }),
}))

export const communityExperiencesRelations = relations(communityExperiences, ({ one }) => ({
  community: one(communities, { fields: [communityExperiences.communityId], references: [communities.id] }),
  experience: one(experiences, { fields: [communityExperiences.experienceId], references: [experiences.id] }),
}))

export const communityHistoricalPeriodsRelations = relations(communityHistoricalPeriods, ({ one }) => ({
  community: one(communities, { fields: [communityHistoricalPeriods.communityId], references: [communities.id] }),
}))

export const communityImagesRelations = relations(communityImages, ({ one }) => ({
  community: one(communities, { fields: [communityImages.communityId], references: [communities.id] }),
}))

export const modulesRelations = relations(modules, ({ many }) => ({
  communities: many(communityModules),
  soughtBy: many(communitySoughtModules),
}))

export const experiencesRelations = relations(experiences, ({ many }) => ({
  communities: many(communityExperiences),
}))
