import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { requireRole } from '../_lib/roles'
import { getAllInventory, appendInventoryItem, allocateNextItemId } from '../_lib/sheets'
import { trackAction } from '../_lib/analytics'
import type { InventoryItem } from '../../src/lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireSession(req, res)
  if (!user) return

  if (req.method === 'GET') {
    try {
      const inventory = await getAllInventory(user.sheet_id)
      return res.status(200).json({ inventory })
    } catch (e: unknown) {
      return res.status(500).json({ error: String(e) })
    }
  }

  if (req.method === 'POST') {
    if (!requireRole(user.role, 'edit', res)) return
    try {
      const body = req.body as Partial<InventoryItem>
      if (!body.item_name?.trim()) return res.status(400).json({ error: 'item_name required' })
      if (body.base_price == null || body.retail_price == null) {
        return res.status(400).json({ error: 'base_price and retail_price required' })
      }
      const item_id = await allocateNextItemId(user.sheet_id)
      const now = new Date().toISOString()
      const item: InventoryItem = {
        item_id,
        item_name: body.item_name.trim(),
        category: body.category ?? 'Misc',
        description_1: body.description_1 ?? '',
        description_2: body.description_2 ?? '',
        base_price: Number(body.base_price),
        retail_price: Number(body.retail_price),
        wholesale_price: body.wholesale_price != null ? Number(body.wholesale_price) : null,
        stock_qty: body.stock_qty != null ? Number(body.stock_qty) : null,
        icon_url: body.icon_url ?? '',
        created_at: now,
        updated_at: now,
        updated_by: user.gmail,
      }
      await appendInventoryItem(user.sheet_id, item)
      trackAction(user, 'add_item')
      return res.status(201).json({ item })
    } catch (e: unknown) {
      console.error('inventory POST error:', e)
      return res.status(500).json({ error: String(e) })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
