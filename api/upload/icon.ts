import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireSession } from '../_lib/session.js'
import { requireRole } from '../_lib/roles.js'
import { uploadIconAsManager } from '../_lib/drive.js'
import { getConfig } from '../_lib/sheets.js'
import { Readable } from 'stream'

export const config = { api: { bodyParser: false } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const user = await requireSession(req, res)
  if (!user) return
  if (!requireRole(user.role, 'edit', res)) return

  try {
    const storeConfig = await getConfig(user.sheet_id)
    const folderId = storeConfig.drive_folder_id
    if (!folderId) return res.status(400).json({ error: 'Drive folder not configured.' })

    const refreshToken = storeConfig.manager_refresh_token
    if (!refreshToken) return res.status(400).json({ error: 'Drive not connected for photo storage. Go to Settings → Connect Google Drive.' })

    const chunks: Buffer[] = []
    for await (const chunk of req as unknown as AsyncIterable<Buffer>) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks)

    const boundary = (req.headers['content-type'] ?? '').split('boundary=')[1]
    if (!boundary) return res.status(400).json({ error: 'Missing multipart boundary' })

    const parts = parseMultipart(body, boundary)
    const filePart = parts.find((p) => p.name === 'icon')
    if (!filePart) return res.status(400).json({ error: 'No icon field in form' })

    const filename = `icon_${Date.now()}.jpg`
    const stream = Readable.from(filePart.data)
    const url = await uploadIconAsManager(folderId, filename, stream, 'image/jpeg', refreshToken)

    res.status(200).json({ url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    // Extract the Drive API error body if present
    const driveErr = (e as { response?: { data?: unknown } })?.response?.data
    console.error('upload/icon error:', driveErr ?? msg)
    res.status(500).json({ error: driveErr ? JSON.stringify(driveErr) : msg })
  }
}

interface MultipartPart { name: string; data: Buffer }

function parseMultipart(body: Buffer, boundary: string): MultipartPart[] {
  const parts: MultipartPart[] = []
  const sep = Buffer.from(`--${boundary}`)
  let start = 0
  while (start < body.length) {
    const sepIdx = body.indexOf(sep, start)
    if (sepIdx === -1) break
    start = sepIdx + sep.length + 2
    const headerEnd = body.indexOf('\r\n\r\n', start)
    if (headerEnd === -1) break
    const headerStr = body.subarray(start, headerEnd).toString()
    start = headerEnd + 4
    const nameMatch = headerStr.match(/name="([^"]+)"/)
    if (!nameMatch) continue
    const nextSep = body.indexOf(sep, start)
    if (nextSep === -1) break
    parts.push({ name: nameMatch[1], data: body.subarray(start, nextSep - 2) })
    start = nextSep
  }
  return parts
}
