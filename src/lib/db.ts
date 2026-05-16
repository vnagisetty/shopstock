import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { InventoryItem, Category, Config, WriteQueueEntry } from './types'

interface ConfigRow extends Config {
  key: string
}

interface ShopStockDB extends DBSchema {
  inventory: {
    key: string
    value: InventoryItem
    indexes: {
      'by-category': string
      'by-name': string
    }
  }
  categories: {
    key: string
    value: Category
    indexes: {
      'by-sort-order': number
    }
  }
  config: {
    key: string
    value: ConfigRow
  }
  writeQueue: {
    key: number
    value: WriteQueueEntry & { id: number }
    indexes: {
      'by-enqueued': string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<ShopStockDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ShopStockDB>('shopstock-db', 1, {
      upgrade(db) {
        const inv = db.createObjectStore('inventory', { keyPath: 'item_id' })
        inv.createIndex('by-category', 'category')
        inv.createIndex('by-name', 'item_name')

        const cat = db.createObjectStore('categories', { keyPath: 'category_id' })
        cat.createIndex('by-sort-order', 'sort_order')

        db.createObjectStore('config', { keyPath: 'key' })

        const wq = db.createObjectStore('writeQueue', { keyPath: 'id', autoIncrement: true })
        wq.createIndex('by-enqueued', 'enqueuedAt')
      },
    })
  }
  return dbPromise
}

export async function getConfig(): Promise<Config | null> {
  const db = await getDB()
  const row = await db.get('config', 'singleton')
  if (!row) return null
  const { key: _k, ...rest } = row
  return rest as Config
}

export async function setConfig(config: Config) {
  const db = await getDB()
  await db.put('config', { key: 'singleton', ...config })
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  const db = await getDB()
  return db.getAll('inventory')
}

export async function putInventoryItem(item: InventoryItem) {
  const db = await getDB()
  await db.put('inventory', item)
}

export async function deleteInventoryItem(item_id: string) {
  const db = await getDB()
  await db.delete('inventory', item_id)
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB()
  return db.getAll('categories')
}

export async function putCategory(cat: Category) {
  const db = await getDB()
  await db.put('categories', cat)
}

export async function deleteCategory(category_id: string) {
  const db = await getDB()
  await db.delete('categories', category_id)
}

export async function enqueueWrite(entry: Omit<WriteQueueEntry, 'id'>) {
  const db = await getDB()
  await db.add('writeQueue', entry as WriteQueueEntry & { id: number })
}

export async function getWriteQueue(): Promise<(WriteQueueEntry & { id: number })[]> {
  const db = await getDB()
  return db.getAllFromIndex('writeQueue', 'by-enqueued')
}

export async function dequeueWrite(id: number) {
  const db = await getDB()
  await db.delete('writeQueue', id)
}

export async function clearAndSeedInventory(items: InventoryItem[]) {
  const db = await getDB()
  const tx = db.transaction('inventory', 'readwrite')
  await tx.store.clear()
  for (const item of items) await tx.store.put(item)
  await tx.done
}

export async function clearAndSeedCategories(cats: Category[]) {
  const db = await getDB()
  const tx = db.transaction('categories', 'readwrite')
  await tx.store.clear()
  for (const cat of cats) await tx.store.put(cat)
  await tx.done
}
