type ReadAction = 'view_item' | 'search' | 'filter_category'

const counters: Record<ReadAction, number> = {
  view_item: 0,
  search: 0,
  filter_category: 0,
}

function hasNonZero() {
  return Object.values(counters).some((v) => v > 0)
}

async function flush() {
  if (!hasNonZero() || !navigator.onLine) return

  const snapshot = { ...counters }
  counters.view_item = 0
  counters.search = 0
  counters.filter_category = 0

  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ actions: snapshot }),
    })
  } catch {
    for (const key of Object.keys(snapshot) as ReadAction[]) {
      counters[key] += snapshot[key]
    }
  }
}

export function trackRead(action: ReadAction) {
  counters[action]++
}

setInterval(() => { void flush() }, 5 * 60 * 1000)

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void flush()
})

window.addEventListener('online', () => { void flush() })
