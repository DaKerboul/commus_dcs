import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://commus:commus@localhost:5432/commus_dcs',
  },
})
