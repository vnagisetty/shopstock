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
    // Service accounts don't have personal storage quota — skip the check
    return { usedFraction: 0, blocked: false }
  }
}

export async function uploadIconToDrive(
  folderId: string,
  filename: string,
  stream: Readable,
  mimeType: string,
): Promise<string> {
  const drive = google.drive({ version: 'v3', auth: getAuth() })

  const file = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: { mimeType, body: stream },
    fields: 'id,webContentLink',
  })

  const fileId = file.data.id!

  // Make the file publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  // Return direct download URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`
}
