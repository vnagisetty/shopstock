import { getIronSession, type IronSession } from 'iron-session'
import type { IncomingMessage, ServerResponse } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Role } from '../../src/lib/types'

export interface SessionData {
  gmail: string
  display_name: string
  role: Role
  sheet_id: string
  // Held temporarily between OAuth callback and store creation, then cleared.
  oauth_access_token?: string
  oauth_refresh_token?: string
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

// Full session: gmail + role + sheet_id all required
export async function requireSession(req: VercelRequest, res: VercelResponse): Promise<SessionData | null> {
  const session = await getSession(req, res)
  if (!session.gmail || !session.role || !session.sheet_id) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return {
    gmail: session.gmail,
    display_name: session.display_name,
    role: session.role,
    sheet_id: session.sheet_id,
  }
}

// Partial session: only gmail required (user authenticated with Google but hasn't created a store yet)
export async function requirePendingSession(
  req: VercelRequest,
  res: VercelResponse,
): Promise<{ gmail: string; display_name: string } | null> {
  const session = await getSession(req, res)
  if (!session.gmail) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  return { gmail: session.gmail, display_name: session.display_name ?? '' }
}
