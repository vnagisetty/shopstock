import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from './_lib/session.js'
import { trackAction } from './_lib/analytics.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireSession(req, res)
  if (!user) return

  const { actions } = req.body as { actions?: Record<string, number> }
  if (!actions || typeof actions !== 'object') return res.status(400).json({ error: 'actions required' })

  const total = Object.values(actions).reduce(
    (sum, v) => sum + (typeof v === 'number' && v > 0 ? v : 0),
    0,
  )
  if (total === 0) return res.status(200).json({ ok: true })

  let lastAction = ''
  let maxCount = 0
  for (const [key, count] of Object.entries(actions)) {
    if (typeof count === 'number' && count > maxCount) {
      maxCount = count
      lastAction = key
    }
  }

  try {
    trackAction(user, lastAction, total)
  } catch { /* analytics errors must never surface to client */ }

  return res.status(200).json({ ok: true })
}
