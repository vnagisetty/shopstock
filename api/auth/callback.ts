import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getOAuthClient } from '../_lib/oauth'
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
  const code = typeof req.query.code === 'string' ? req.query.code : ''
  const state = typeof req.query.state === 'string' ? req.query.state : ''
  const inviteToken = state || ''

  if (!code) {
    return res.redirect(302, '/login?error=oauth_failed')
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Fetch user info (identity only)
    const oauth2 = (await import('googleapis')).google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    const gmail = userInfo.data.email ?? ''
    const display_name = userInfo.data.name ?? gmail

    if (!gmail) return res.redirect(302, '/login?error=oauth_failed')

    // Initialize sheet structure on very first run (idempotent)
    await initializeSheet()

    const allStaff = await getAllStaff()
    const noManagerExists = !allStaff.some((s) => s.role === 'manager')

    // Bootstrap: first login ever → make this user the manager
    if (noManagerExists) {
      const now = new Date().toISOString()
      const managerRow = {
        gmail,
        display_name,
        role: 'manager' as const,
        status: 'active' as const,
        invite_token: '',
        invite_expires_at: '',
        invited_at: now,
        joined_at: now,
      }
      await appendStaff(managerRow)
      const session = await getSession(req, res)
      session.gmail = gmail
      session.display_name = display_name
      session.role = 'manager'
      await session.save()
      return res.redirect(302, '/')
    }

    // Check invite token flow
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

    // Normal login: check Staff tab
    const staff = await getStaffByGmail(gmail)
    if (!staff || staff.status !== 'active') {
      return res.redirect(302, '/login?error=not_authorized')
    }

    // Update display name if changed
    if (staff.display_name !== display_name) {
      await updateStaff({ ...staff, display_name })
    }

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
