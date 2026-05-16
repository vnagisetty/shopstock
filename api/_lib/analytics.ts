import { google } from 'googleapis'
import type { SessionData } from './session'

// Usage tab columns: A=gmail B=display_name C=role D=store_name E=sheet_id
//   F=first_seen_at G=last_active_at H=action_count I=last_action

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export function trackAction(
  user: Pick<SessionData, 'gmail' | 'display_name' | 'role'>,
  action: string,
  actionCountDelta = 1,
): void {
  const analyticsSheetId = process.env.ANALYTICS_SHEET_ID
  if (!analyticsSheetId) return

  Promise.resolve().then(async () => {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const now = new Date().toISOString()
    const storeSheetId = process.env.GOOGLE_SHEETS_ID ?? ''

    let store_name = ''
    try {
      const configRes = await sheets.spreadsheets.values.get({
        spreadsheetId: storeSheetId,
        range: 'Config!A2:A2',
      })
      store_name = (configRes.data.values as string[][])?.[0]?.[0] ?? ''
    } catch { /* ignore — store_name stays empty */ }

    const usageRes = await sheets.spreadsheets.values.get({
      spreadsheetId: analyticsSheetId,
      range: 'Usage!A2:I',
    })
    const rows = (usageRes.data.values ?? []) as string[][]
    const idx = rows.findIndex((r) => r[0] === user.gmail)

    if (idx === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: analyticsSheetId,
        range: 'Usage!A:I',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            user.gmail,
            user.display_name,
            user.role,
            store_name,
            storeSheetId,
            now,
            now,
            String(actionCountDelta),
            action,
          ]],
        },
      })
    } else {
      const sheetRow = idx + 2
      const currentCount = parseInt(rows[idx][7] ?? '0') || 0
      await sheets.spreadsheets.values.update({
        spreadsheetId: analyticsSheetId,
        range: `Usage!A${sheetRow}:I${sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            user.gmail,
            user.display_name,
            user.role,
            store_name || rows[idx][3],
            storeSheetId,
            rows[idx][5],
            now,
            String(currentCount + actionCountDelta),
            action,
          ]],
        },
      })
    }
  }).catch((err) => {
    console.error('[analytics] trackAction failed:', err)
  })
}
