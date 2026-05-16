import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session'
import { requireRole } from '../_lib/roles'
import { getAllCategories, updateCategory, deleteCategory } from '../_lib/sheets'
import { trackAction } from '../_lib/analytics'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireSession(req, res)
  if (!user) return
  if (!requireRole(user.role, 'manager', res)) return

  const id = typeof req.query.id === 'string' ? req.query.id : ''

  if (req.method === 'PUT') {
    try {
      const cats = await getAllCategories(user.sheet_id)
      const cat = cats.find((c) => c.category_id === id)
      if (!cat) return res.status(404).json({ error: 'Not found' })
      const body = req.body as Partial<typeof cat>
      const updated = { ...cat, ...body, category_id: cat.category_id }
      await updateCategory(user.sheet_id, updated)
      res.status(200).json({ category: updated })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  if (req.method === 'DELETE') {
    try {
      const cats = await getAllCategories(user.sheet_id)
      const cat = cats.find((c) => c.category_id === id)
      if (!cat) return res.status(404).json({ error: 'Not found' })
      if (cat.category_name === 'Misc') return res.status(400).json({ error: 'Cannot delete Misc category' })
      await deleteCategory(user.sheet_id, id)
      trackAction(user, 'delete_category')
      res.status(200).json({ ok: true })
    } catch (e: unknown) {
      res.status(500).json({ error: String(e) })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
