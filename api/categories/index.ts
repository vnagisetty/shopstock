import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { requireRole } from '../_lib/roles'
import { getAllCategories, appendCategory, getNextCategoryId, getNextCategorySortOrder } from '../_lib/sheets'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireSession(req, res)
  if (!user) return

  if (req.method === 'GET') {
    try {
      const categories = await getAllCategories()
      res.status(200).json({ categories })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  if (req.method === 'POST') {
    if (!requireRole(user.role, 'manager', res)) return
    try {
      const { category_name } = req.body as { category_name?: string }
      if (!category_name?.trim()) return res.status(400).json({ error: 'category_name required' })
      const category_id = await getNextCategoryId()
      const sort_order = await getNextCategorySortOrder()
      const cat = { category_id, category_name: category_name.trim(), sort_order, created_at: new Date().toISOString() }
      await appendCategory(cat)
      res.status(201).json({ category: cat })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
