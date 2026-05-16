import { google } from 'googleapis'

// Central registry sheet (REGISTRY_SHEET_ID env var)
// Tab "Stores": A=gmail B=display_name C=sheet_id D=store_name E=created_at

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function getRegistryId(): string {
  const id = process.env.REGISTRY_SHEET_ID
  if (!id) throw new Error('REGISTRY_SHEET_ID env var is not set')
  return id
}

export interface StoreEntry {
  gmail: string
  display_name: string
  sheet_id: string
  store_name: string
  created_at: string
}

export async function lookupUserStore(gmail: string): Promise<StoreEntry | null> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getRegistryId(),
    range: 'Stores!A2:E',
  })
  const rows = (res.data.values ?? []) as string[][]
  const row = rows.find((r) => r[0] === gmail)
  if (!row) return null
  return {
    gmail: row[0] ?? '',
    display_name: row[1] ?? '',
    sheet_id: row[2] ?? '',
    store_name: row[3] ?? '',
    created_at: row[4] ?? '',
  }
}

export async function registerUserStore(
  gmail: string,
  display_name: string,
  sheet_id: string,
  store_name: string,
): Promise<void> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const registryId = getRegistryId()

  // Check if the user already has a row and update it, otherwise append
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: registryId,
    range: 'Stores!A2:A',
  })
  const rows = (res.data.values ?? []) as string[][]
  const idx = rows.findIndex((r) => r[0] === gmail)
  const now = new Date().toISOString()

  if (idx === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: registryId,
      range: 'Stores!A:E',
      valueInputOption: 'RAW',
      requestBody: { values: [[gmail, display_name, sheet_id, store_name, now]] },
    })
  } else {
    const sheetRow = idx + 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: registryId,
      range: `Stores!A${sheetRow}:E${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[gmail, display_name, sheet_id, store_name, now]] },
    })
  }
}
