import { getIronSession, type IronSession } from 'iron-session'
import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Role } from '../../src/lib/types'

export interface SessionData {
  gmail: string
  display_name: string
  role: Role
}

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? 'fallback-secret-change-in-production',
  cookieName: 'shopstock-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
}

export async function getSession(req: IncomingMessage, res: ServerResponse): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, SESSION_OPTIONS)
}

export async function requireSession(req: VercelRequest, res: VercelResponse): Promise<SessionData | null> {
  const session = await getSession(req, res)
  if (!session.gmail) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return { gmail: session.gmail, display_name: session.display_name, role: session.role }
}
