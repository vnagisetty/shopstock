import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSession } from '../_lib/session'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const session = await getSession(req, res)
  session.destroy()
  await session.save()
  res.status(200).json({ ok: true })
}
