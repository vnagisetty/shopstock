import { google } from 'googleapis'
import type { InventoryItem, Category, Config, StaffMember } from '../../src/lib/types'

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })
}

function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

// ── Column layouts (A=1) ──────────────────────────────────────────────────────
// Inventory: A=item_id B=item_name C=category D=desc1 E=desc2 F=base_price
//            G=retail_price H=wholesale_price I=stock_qty J=icon_url
//            K=created_at L=updated_at M=updated_by
// Staff:     A=gmail B=display_name C=role D=status E=invite_token
//            F=invite_expires_at G=invited_at H=joined_at
// Config:    A=store_name B=drive_folder_id C=last_item_seq D=drive_quota_warning_sent
// Categories:A=category_id B=category_name C=sort_order D=created_at

function rowToItem(r: string[]): InventoryItem {
  return {
    item_id: r[0] ?? '',
    item_name: r[1] ?? '',
    category: r[2] ?? 'Misc',
    description_1: r[3] ?? '',
    description_2: r[4] ?? '',
    base_price: parseFloat(r[5] ?? '0') || 0,
    retail_price: parseFloat(r[6] ?? '0') || 0,
    wholesale_price: r[7] ? parseFloat(r[7]) : null,
    stock_qty: r[8] ? parseInt(r[8]) : null,
    icon_url: r[9] ?? '',
    created_at: r[10] ?? '',
    updated_at: r[11] ?? '',
    updated_by: r[12] ?? '',
  }
}

function itemToRow(item: InventoryItem): string[] {
  return [
    item.item_id,
    item.item_name,
    item.category,
    item.description_1,
    item.description_2,
    String(item.base_price),
    String(item.retail_price),
    item.wholesale_price !== null ? String(item.wholesale_price) : '',
    item.stock_qty !== null ? String(item.stock_qty) : '',
    item.icon_url,
    item.created_at,
    item.updated_at,
    item.updated_by,
  ]
}

function rowToCategory(r: string[]): Category {
  return {
    category_id: r[0] ?? '',
    category_name: r[1] ?? '',
    sort_order: parseInt(r[2] ?? '0') || 0,
    created_at: r[3] ?? '',
  }
}

function rowToStaff(r: string[]): StaffMember {
  return {
    gmail: r[0] ?? '',
    display_name: r[1] ?? '',
    role: (r[2] as StaffMember['role']) ?? 'view',
    status: (r[3] as StaffMember['status']) ?? 'invited',
    invite_token: r[4] ?? '',
    invite_expires_at: r[5] ?? '',
    invited_at: r[6] ?? '',
    joined_at: r[7] ?? '',
  }
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export async function getAllInventory(): Promise<InventoryItem[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Inventory!A2:M' })
  return ((res.data.values ?? []) as string[][]).filter((r) => r[0]).map(rowToItem)
}

export async function getInventoryItem(item_id: string): Promise<InventoryItem | null> {
  const all = await getAllInventory()
  return all.find((i) => i.item_id === item_id) ?? null
}

export async function appendInventoryItem(item: InventoryItem): Promise<void> {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Inventory!A:M',
    valueInputOption: 'RAW',
    requestBody: { values: [itemToRow(item)] },
  })
}

export async function updateInventoryItem(item: InventoryItem): Promise<void> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Inventory!A2:A' })
  const rows = (res.data.values ?? []) as string[][]
  const idx = rows.findIndex((r) => r[0] === item.item_id)
  if (idx === -1) throw new Error(`Item ${item.item_id} not found`)
  const sheetRow = idx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Inventory!A${sheetRow}:M${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [itemToRow(item)] },
  })
}

export async function deleteInventoryItem(item_id: string): Promise<void> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Inventory!A2:A' })
  const rows = (res.data.values ?? []) as string[][]
  const idx = rows.findIndex((r) => r[0] === item_id)
  if (idx === -1) throw new Error(`Item ${item_id} not found`)
  const sheetId = await getTabSheetId('Inventory')
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: idx + 1, endIndex: idx + 2 },
        },
      }],
    },
  })
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getAllCategories(): Promise<Category[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Categories!A2:D' })
  return ((res.data.values ?? []) as string[][]).filter((r) => r[0]).map(rowToCategory)
}

export async function appendCategory(cat: Category): Promise<void> {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Categories!A:D',
    valueInputOption: 'RAW',
    requestBody: { values: [[cat.category_id, cat.category_name, String(cat.sort_order), cat.created_at]] },
  })
}

export async function updateCategory(cat: Category): Promise<void> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Categories!A2:A' })
  const rows = (res.data.values ?? []) as string[][]
  const idx = rows.findIndex((r) => r[0] === cat.category_id)
  if (idx === -1) throw new Error(`Category ${cat.category_id} not found`)
  const sheetRow = idx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Categories!A${sheetRow}:D${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[cat.category_id, cat.category_name, String(cat.sort_order), cat.created_at]] },
  })
}

export async function deleteCategory(category_id: string): Promise<void> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Categories!A2:A' })
  const rows = (res.data.values ?? []) as string[][]
  const idx = rows.findIndex((r) => r[0] === category_id)
  if (idx === -1) throw new Error(`Category ${category_id} not found`)
  const sheetId = await getTabSheetId('Categories')
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId, dimension: 'ROWS', startIndex: idx + 1, endIndex: idx + 2 },
        },
      }],
    },
  })
}

export async function getNextCategoryId(): Promise<string> {
  const cats = await getAllCategories()
  const maxNum = cats.reduce((max, c) => {
    const n = parseInt(c.category_id.replace('CAT', ''))
    return n > max ? n : max
  }, 0)
  return `CAT${String(maxNum + 1).padStart(3, '0')}`
}

export async function getNextCategorySortOrder(): Promise<number> {
  const cats = await getAllCategories()
  const maxOrd = cats.reduce((max, c) => (c.sort_order > max ? c.sort_order : max), 0)
  return maxOrd + 1
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function getAllStaff(): Promise<StaffMember[]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Staff!A2:H' })
  return ((res.data.values ?? []) as string[][]).filter((r) => r[0]).map(rowToStaff)
}

export async function getStaffByGmail(gmail: string): Promise<StaffMember | null> {
  const all = await getAllStaff()
  return all.find((s) => s.gmail === gmail) ?? null
}

export async function getStaffByToken(token: string): Promise<StaffMember | null> {
  const all = await getAllStaff()
  return all.find((s) => s.invite_token === token) ?? null
}

export async function appendStaff(s: StaffMember): Promise<void> {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Staff!A:H',
    valueInputOption: 'RAW',
    requestBody: { values: [[s.gmail, s.display_name, s.role, s.status, s.invite_token, s.invite_expires_at, s.invited_at, s.joined_at]] },
  })
}

export async function updateStaff(s: StaffMember): Promise<void> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Staff!A2:A' })
  const rows = (res.data.values ?? []) as string[][]
  const idx = rows.findIndex((r) => r[0] === s.gmail)
  if (idx === -1) throw new Error(`Staff ${s.gmail} not found`)
  const sheetRow = idx + 2
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Staff!A${sheetRow}:H${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[s.gmail, s.display_name, s.role, s.status, s.invite_token, s.invite_expires_at, s.invited_at, s.joined_at]] },
  })
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<Config> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Config!A2:D2' })
  const row = ((res.data.values ?? []) as string[][])[0] ?? []
  return {
    store_name: row[0] ?? '',
    drive_folder_id: row[1] ?? '',
    last_item_seq: parseInt(row[2] ?? '0') || 0,
    drive_quota_warning_sent: row[3] === 'true',
  }
}

export async function updateConfig(config: Partial<Config>): Promise<void> {
  const current = await getConfig()
  const merged = { ...current, ...config }
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Config!A2:D2',
    valueInputOption: 'RAW',
    requestBody: { values: [[merged.store_name, merged.drive_folder_id, String(merged.last_item_seq), String(merged.drive_quota_warning_sent)]] },
  })
}

export async function allocateNextItemId(): Promise<string> {
  const config = await getConfig()
  const next = config.last_item_seq + 1
  await updateConfig({ last_item_seq: next })
  return String(next).padStart(3, '0')
}

// ── Sheet tab ID helper ───────────────────────────────────────────────────────

export async function getTabSheetId(tabName: string): Promise<number> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const tab = (res.data.sheets ?? []).find((s) => s.properties?.title === tabName)
  return tab?.properties?.sheetId ?? 0
}

// ── Sheet initialization (called on first manager login) ──────────────────────

export async function initializeSheet(): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const existingTabs = (spreadsheet.data.sheets ?? []).map((s) => s.properties?.title ?? '')

  const tabs = [
    { title: 'Inventory', header: ['item_id','item_name','category','description_1','description_2','base_price','retail_price','wholesale_price','stock_qty','icon_url','created_at','updated_at','updated_by'] },
    { title: 'Staff', header: ['gmail','display_name','role','status','invite_token','invite_expires_at','invited_at','joined_at'] },
    { title: 'Config', header: ['store_name','drive_folder_id','last_item_seq','drive_quota_warning_sent'] },
    { title: 'Categories', header: ['category_id','category_name','sort_order','created_at'] },
  ]

  const addRequests = tabs
    .filter((t) => !existingTabs.includes(t.title))
    .map((t) => ({ addSheet: { properties: { title: t.title } } }))

  if (addRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: addRequests } })
  }

  // Write headers to each tab if they're empty
  for (const tab of tabs) {
    const check = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${tab.title}!A1:A1` })
    if (!check.data.values?.[0]?.[0]) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${tab.title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [tab.header] },
      })
    }
  }

  // Seed Config row if empty
  const configCheck = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Config!A2:D2' })
  if (!configCheck.data.values?.[0]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'Config!A2:D2',
      valueInputOption: 'RAW',
      requestBody: { values: [['My Store', '', '0', 'false']] },
    })
  }

  // Seed Misc category if no categories exist
  const catCheck = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Categories!A2:A' })
  if (!catCheck.data.values?.[0]) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Categories!A:D',
      valueInputOption: 'RAW',
      requestBody: { values: [['CAT001', 'Misc', '999', new Date().toISOString()]] },
    })
  }
}

export { rowToStaff }
