// Liveness probe for Docker/Coolify healthchecks.
// Intentionally does NOT touch the database — it only proves the Nitro server responds.
export default defineEventHandler(() => ({ ok: true }))
