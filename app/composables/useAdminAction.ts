/**
 * Runs an admin mutation with consistent feedback.
 *
 * Admin pages previously reported failures through a native `alert()` or a
 * silent `console.error`, and never signalled success at all — so an action
 * that failed looked exactly like one that worked. `UApp` is mounted in
 * app.vue, so toasts are available everywhere; this just makes their use
 * uniform.
 */
export function useAdminAction() {
  const toast = useToast()

  /** Id of the row currently being acted on, for per-row spinners. */
  const pendingId = ref<number | string | null>(null)

  async function run<T>(
    id: number | string,
    fn: () => Promise<T>,
    messages: { success: string; error?: string },
  ): Promise<T | null> {
    pendingId.value = id

    try {
      const result = await fn()
      toast.add({
        title: messages.success,
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })
      return result
    } catch (error: any) {
      toast.add({
        title: messages.error ?? "L'action a échoué",
        // Server messages are already written in French for the user.
        description: error?.data?.statusMessage || error?.statusMessage,
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      })
      return null
    } finally {
      pendingId.value = null
    }
  }

  const isPending = (id: number | string) => pendingId.value === id

  return { run, pendingId, isPending }
}
