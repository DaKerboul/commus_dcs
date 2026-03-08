import { experiences } from '#server/db/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const db = useDB()
  return await db.select({
    id: experiences.id,
    name: experiences.name,
    slug: experiences.slug,
    icon: experiences.icon,
    category: experiences.category,
  }).from(experiences).orderBy(asc(experiences.name))
})
