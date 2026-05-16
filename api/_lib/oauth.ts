import { google } from 'googleapis'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

export const OAUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  // Needed only for managers during store creation: creates one Sheet + one
  // Drive folder in their own account and shares both with the service account.
  'https://www.googleapis.com/auth/drive.file',
]
