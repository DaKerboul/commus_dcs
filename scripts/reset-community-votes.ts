import { inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { communities, communityVotes } from '../server/db/schema'

const slugs = process.argv.slice(2)

if (slugs.length === 0) {
  console.error('Usage: tsx scripts/reset-community-votes.ts <slug> [slug...]')
  process.exit(1)
}

const databaseUrl = process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL (or NUXT_DATABASE_URL) is required')
  process.exit(1)
}

const client = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
})

const db = drizzle(client)

try {
  const targets = await db
    .select({ id: communities.id, slug: communities.slug, votes: communities.votes })
    .from(communities)
    .where(inArray(communities.slug, slugs))

  if (targets.length === 0) {
    console.error(`No communities found for slugs: ${slugs.join(', ')}`)
    process.exit(1)
  }

  const targetIds = targets.map(target => target.id)

  await db.transaction(async (tx) => {
    await tx
      .delete(communityVotes)
      .where(inArray(communityVotes.communityId, targetIds))

    await tx
      .update(communities)
      .set({ votes: 0 })
      .where(inArray(communities.id, targetIds))
  })

  for (const target of targets) {
    console.log(`Reset votes for ${target.slug} (${target.votes || 0} -> 0)`)
  }
} finally {
  await client.end()
}
