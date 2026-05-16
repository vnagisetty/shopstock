export type Role = 'manager' | 'full' | 'edit' | 'view'
export type StaffStatus = 'invited' | 'active' | 'revoked'

export interface InventoryItem {
  item_id: string
  item_name: string
  category: string
  description_1: string
  description_2: string
  base_price: number
  retail_price: number
  wholesale_price: number | null
  stock_qty: number | null
  icon_url: string
  created_at: string
  updated_at: string
  updated_by: string
}

export interface Category {
  category_id: string
  category_name: string
  sort_order: number
  created_at: string
}

export interface Config {
  store_name: string
  drive_folder_id: string
  last_item_seq: number
  drive_quota_warning_sent: boolean
}

export interface StaffMember {
  gmail: string
  display_name: string
  role: Role
  status: StaffStatus
  invite_token: string
  invite_expires_at: string
  invited_at: string
  joined_at: string
}

export interface SessionUser {
  gmail: string
  display_name: string
  role: Role
  sheet_id: string
}

export interface SyncSnapshot {
  inventory: InventoryItem[]
  categories: Category[]
  config: Config
}

export type WriteOperation = 'create' | 'update' | 'delete'
export type WriteResource = 'inventory' | 'categories' | 'config'

export interface WriteQueueEntry {
  id?: number
  operation: WriteOperation
  resource: WriteResource
  resourceId: string | null
  payload: Record<string, unknown>
  enqueuedAt: string
}
