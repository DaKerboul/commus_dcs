export function useCountUp(target: Ref<number>, duration = 900) {
  const displayed = ref(0)
  let rafId: number | null = null

  function animate(from: number, to: number) {
    if (rafId !== null) cancelAnimationFrame(rafId)
    const start = performance.now()

    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - (1 - progress) ** 3
      displayed.value = Math.round(from + (to - from) * eased)
      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }

    rafId = requestAnimationFrame(step)
  }

  watch(target, (to, from) => {
    animate(from ?? 0, to)
  })

  onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  return displayed
}
