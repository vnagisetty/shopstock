import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getOAuthClient, OAUTH_SCOPES } from '../_lib/oauth.js'
import { getSession } from '../_lib/session.js'
import { requirePendingSession } from '../_lib/session.js'
import { lookupUserStore, registerUserStore } from '../_lib/registry.js'
import {
  getAllStaff,
  getStaffByGmail,
  getStaffByToken,
  appendStaff,
  updateStaff,
  initializeSheet,
  createStoreSpreadsheet,
  updateConfig,
} from '../_lib/sheets.js'
import { createDriveFolder } from '../_lib/drive.js'

interface OAuthState {
  invite?: string
  store?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = typeof req.query.action === 'string' ? req.query.action : ''

  // ── GET /api/auth/login ───────────────────────────────────────────────────
  if (action === 'login') {
    const oauth2Client = getOAuthClient()
    const invite = typeof req.query.invite === 'string' ? req.query.invite : ''
    const store  = typeof req.query.store  === 'string' ? req.query.store  : ''
    const state: OAuthState = {}
    if (invite) state.invite = invite
    if (store)  state.store  = store
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: OAUTH_SCOPES,
      prompt: 'select_account',
      state: JSON.stringify(state),
    })
    return res.redirect(302, url)
  }

  // ── GET /api/auth/callback ────────────────────────────────────────────────
  if (action === 'callback') {
    const code  = typeof req.query.code  === 'string' ? req.query.code  : ''
    const stateRaw = typeof req.query.state === 'string' ? req.query.state : '{}'
    if (!code) return res.redirect(302, '/login?error=oauth_failed')

    let stateData: OAuthState = {}
    try { stateData = JSON.parse(stateRaw) } catch { /* empty state */ }
    const inviteToken = stateData.invite ?? ''
    const storeId     = stateData.store  ?? ''

    try {
      const oauth2Client = getOAuthClient()
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      const { google } = await import('googleapis')
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      const userInfo = await oauth2.userinfo.get()
      const gmail        = userInfo.data.email ?? ''
      const display_name = userInfo.data.name  ?? gmail
      if (!gmail) return res.redirect(302, '/login?error=oauth_failed')

      // 1. Invite flow: validate token against the specified store
      if (inviteToken && storeId) {
        try {
          const invited = await getStaffByToken(storeId, inviteToken)
          if (!invited) return res.redirect(302, '/login?error=invite_invalid')
          if (new Date(invited.invite_expires_at) < new Date()) return res.redirect(302, '/login?error=invite_expired')
          const now = new Date().toISOString()
          const activated = { ...invited, gmail, display_name, status: 'active' as const, joined_at: now, invite_token: '' }
          await updateStaff(storeId, activated)
          await registerUserStore(gmail, display_name, storeId, '')
          const session = await getSession(req, res)
          session.gmail        = gmail
          session.display_name = display_name
          session.role         = activated.role
          session.sheet_id     = storeId
          await session.save()
          return res.redirect(302, '/')
        } catch {
          return res.redirect(302, '/login?error=invite_invalid')
        }
      }

      // 2. Check registry: returning user with an existing store
      try {
        const entry = await lookupUserStore(gmail)
        if (entry?.sheet_id) {
          const staff = await getStaffByGmail(entry.sheet_id, gmail)
          if (staff && staff.status === 'active') {
            if (staff.display_name !== display_name) {
              await updateStaff(entry.sheet_id, { ...staff, display_name })
            }
            const session = await getSession(req, res)
            session.gmail        = gmail
            session.display_name = display_name
            session.role         = staff.role
            session.sheet_id     = entry.sheet_id
            await session.save()
            return res.redirect(302, '/')
          }
        }
      } catch { /* registry not configured or unreachable — fall through */ }

      // 3. Legacy fallback: check GOOGLE_SHEETS_ID env var (existing single-store deployments)
      const legacySheetId = process.env.GOOGLE_SHEETS_ID
      if (legacySheetId) {
        try {
          await initializeSheet(legacySheetId)
          const allStaff = await getAllStaff(legacySheetId)
          const noManager = !allStaff.some((s) => s.role === 'manager')

          if (noManager) {
            // First ever login on a legacy deployment — make this user manager
            const now = new Date().toISOString()
            await appendStaff(legacySheetId, {
              gmail, display_name, role: 'manager', status: 'active',
              invite_token: '', invite_expires_at: '', invited_at: now, joined_at: now,
            })
            await registerUserStore(gmail, display_name, legacySheetId, '').catch(() => {})
            const session = await getSession(req, res)
            session.gmail        = gmail
            session.display_name = display_name
            session.role         = 'manager'
            session.sheet_id     = legacySheetId
            await session.save()
            return res.redirect(302, '/')
          }

          const staff = await getStaffByGmail(legacySheetId, gmail)
          if (staff && staff.status === 'active') {
            if (staff.display_name !== display_name) {
              await updateStaff(legacySheetId, { ...staff, display_name })
            }
            await registerUserStore(gmail, display_name, legacySheetId, '').catch(() => {})
            const session = await getSession(req, res)
            session.gmail        = gmail
            session.display_name = display_name
            session.role         = staff.role
            session.sheet_id     = legacySheetId
            await session.save()
            return res.redirect(302, '/')
          }
        } catch { /* legacy sheet unreachable — fall through */ }
      }

      // 4. Unknown user — set partial session and send to store creation.
      //    Stash the access token so the setup step can create resources in
      //    the manager's own Google Drive.
      const session = await getSession(req, res)
      session.gmail              = gmail
      session.display_name       = display_name
      session.oauth_access_token = tokens.access_token ?? ''
      await session.save()
      return res.redirect(302, '/setup')
    } catch (e: unknown) {
      console.error('OAuth callback error:', e)
      return res.redirect(302, '/login?error=oauth_failed')
    }
  }

  // ── GET /api/auth/pending ─────────────────────────────────────────────────
  // Returns the partial session user info for the /setup page
  if (action === 'pending') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    const session = await getSession(req, res)
    if (!session.gmail) return res.status(401).json({ error: 'No pending session' })
    return res.status(200).json({ gmail: session.gmail, display_name: session.display_name })
  }

  // ── POST /api/auth/setup ──────────────────────────────────────────────────
  // Creates a new store for the user currently in pending session state
  if (action === 'setup') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const pending = await requirePendingSession(req, res)
    if (!pending) return

    // Read the full session directly to get the stashed OAuth token
    const setupSession = await getSession(req, res)
    const accessToken = setupSession.oauth_access_token ?? ''
    if (!accessToken) return res.status(400).json({ error: 'OAuth token missing — please sign in again' })

    const { store_name } = req.body as { store_name?: string }
    if (!store_name?.trim()) return res.status(400).json({ error: 'store_name required' })
    const name = store_name.trim()

    try {
      // Create the Google Sheet in the manager's own Drive, shared with service account
      const newSheetId = await createStoreSpreadsheet(name, accessToken)

      // Initialize tabs + seed data (uses service account, which now has Editor access)
      await initializeSheet(newSheetId)

      // Set the store name in Config
      await updateConfig(newSheetId, { store_name: name })

      // Create a Drive folder for item icons — also in the manager's Drive
      let folderId = ''
      try {
        folderId = await createDriveFolder(`${name} — Item Icons`, accessToken)
        await updateConfig(newSheetId, { drive_folder_id: folderId })
      } catch { /* non-fatal — manager can set folder manually */ }

      // Add the user as manager in the new sheet's Staff tab
      const now = new Date().toISOString()
      await appendStaff(newSheetId, {
        gmail: pending.gmail,
        display_name: pending.display_name,
        role: 'manager',
        status: 'active',
        invite_token: '',
        invite_expires_at: '',
        invited_at: now,
        joined_at: now,
      })

      // Register in central registry
      await registerUserStore(pending.gmail, pending.display_name, newSheetId, name)

      // Promote partial session to full session (clear the temporary OAuth token)
      const session = await getSession(req, res)
      session.gmail              = pending.gmail
      session.display_name       = pending.display_name
      session.role               = 'manager'
      session.sheet_id           = newSheetId
      session.oauth_access_token = undefined
      await session.save()

      return res.status(200).json({ ok: true, sheet_id: newSheetId })
    } catch (e: unknown) {
      console.error('Store creation error:', e)
      return res.status(500).json({ error: String(e) })
    }
  }

  // ── POST /api/auth/logout ─────────────────────────────────────────────────
  if (action === 'logout') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const session = await getSession(req, res)
    session.destroy()
    await session.save()
    return res.status(200).json({ ok: true })
  }

  res.status(404).json({ error: 'Unknown auth action' })
}
