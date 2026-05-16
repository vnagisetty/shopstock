import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getOAuthClient, OAUTH_SCOPES } from '../_lib/oauth'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const oauth2Client = getOAuthClient()
  const invite = typeof req.query.invite === 'string' ? req.query.invite : ''
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_SCOPES,
    prompt: 'select_account',
    state: invite,
  })
  res.redirect(302, url)
}
