import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from './_lib/session.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const user = await requireSession(req, res)
  if (!user) return
  res.status(200).json(user)
}
