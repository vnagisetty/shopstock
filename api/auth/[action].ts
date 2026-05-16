import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getOAuthClient, OAUTH_SCOPES } from '../_lib/oauth'
import { getSession } from '../_lib/session'
import {
  getAllStaff,
  getStaffByGmail,
  appendStaff,
  updateStaff,
  getStaffByToken,
  initializeSheet,
} from '../_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = typeof req.query.action === 'string' ? req.query.action : ''

  // GET /api/auth/login
  if (action === 'login') {
    const oauth2Client = getOAuthClient()
    const invite = typeof req.query.invite === 'string' ? req.query.invite : ''
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: OAUTH_SCOPES,
      prompt: 'select_account',
      state: invite,
    })
    return res.redirect(302, url)
  }

  // GET /api/auth/callback
  if (action === 'callback') {
    const code = typeof req.query.code === 'string' ? req.query.code : ''
    const state = typeof req.query.state === 'string' ? req.query.state : ''
    const inviteToken = state || ''

    if (!code) return res.redirect(302, '/login?error=oauth_failed')

    try {
      const oauth2Client = getOAuthClient()
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      const { google } = await import('googleapis')
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      const userInfo = await oauth2.userinfo.get()
      const gmail = userInfo.data.email ?? ''
      const display_name = userInfo.data.name ?? gmail

      if (!gmail) return res.redirect(302, '/login?error=oauth_failed')

      await initializeSheet()

      const allStaff = await getAllStaff()
      const noManagerExists = !allStaff.some((s) => s.role === 'manager')

      if (noManagerExists) {
        const now = new Date().toISOString()
        await appendStaff({
          gmail, display_name, role: 'manager', status: 'active',
          invite_token: '', invite_expires_at: '', invited_at: now, joined_at: now,
        })
        const session = await getSession(req, res)
        session.gmail = gmail
        session.display_name = display_name
        session.role = 'manager'
        await session.save()
        return res.redirect(302, '/')
      }

      if (inviteToken) {
        const invitedStaff = await getStaffByToken(inviteToken)
        if (!invitedStaff) return res.redirect(302, '/login?error=invite_invalid')
        if (new Date(invitedStaff.invite_expires_at) < new Date()) return res.redirect(302, '/login?error=invite_expired')
        const now = new Date().toISOString()
        const activated = { ...invitedStaff, gmail, display_name, status: 'active' as const, joined_at: now, invite_token: '' }
        await updateStaff(activated)
        const session = await getSession(req, res)
        session.gmail = gmail
        session.display_name = display_name
        session.role = activated.role
        await session.save()
        return res.redirect(302, '/')
      }

      const staff = await getStaffByGmail(gmail)
      if (!staff || staff.status !== 'active') return res.redirect(302, '/login?error=not_authorized')
      if (staff.display_name !== display_name) await updateStaff({ ...staff, display_name })

      const session = await getSession(req, res)
      session.gmail = gmail
      session.display_name = display_name
      session.role = staff.role
      await session.save()
      return res.redirect(302, '/')
    } catch (e: unknown) {
      console.error('OAuth callback error:', e)
      return res.redirect(302, '/login?error=oauth_failed')
    }
  }

  // POST /api/auth/logout
  if (action === 'logout') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const session = await getSession(req, res)
    session.destroy()
    await session.save()
    return res.status(200).json({ ok: true })
  }

  res.status(404).json({ error: 'Unknown auth action' })
}
