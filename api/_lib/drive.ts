import { google } from 'googleapis'
import type { Readable } from 'stream'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
}

export async function checkDriveQuota(): Promise<{ usedFraction: number; blocked: boolean }> {
  try {
    const drive = google.drive({ version: 'v3', auth: getAuth() })
    const res = await drive.about.get({ fields: 'storageQuota' })
    const quota = res.data.storageQuota
    if (!quota?.limit || !quota.usageInDrive) return { usedFraction: 0, blocked: false }
    const usedFraction = parseInt(quota.usageInDrive) / parseInt(quota.limit)
    return { usedFraction, blocked: usedFraction > 0.9 }
  } catch {
    return { usedFraction: 0, blocked: false }
  }
}

// Creates the icon folder in the manager's Google Drive (not the service
// account's), then shares it with the service account so icon uploads work.
export async function createDriveFolder(name: string, userAccessToken: string): Promise<string> {
  const userAuth = new google.auth.OAuth2()
  userAuth.setCredentials({ access_token: userAccessToken })

  const drive = google.drive({ version: 'v3', auth: userAuth })
  const res = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
  })
  const folderId = res.data.id!

  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      role: 'writer',
      type: 'user',
      emailAddress: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    },
    sendNotificationEmail: false,
  })

  return folderId
}

export async function uploadIconToDrive(
  folderId: string,
  filename: string,
  stream: Readable,
  mimeType: string,
): Promise<string> {
  const drive = google.drive({ version: 'v3', auth: getAuth() })

  const file = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: 'id,webContentLink',
  })

  const fileId = file.data.id!
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return `https://drive.google.com/uc?export=view&id=${fileId}`
}
