import { enqueueWrite, getWriteQueue, dequeueWrite } from './db'
import type { WriteOperation, WriteResource } from './types'
import { apiFetch } from './api'

export async function queueWrite(
  operation: WriteOperation,
  resource: WriteResource,
  resourceId: string | null,
  payload: Record<string, unknown>,
) {
  await enqueueWrite({ operation, resource, resourceId, payload, enqueuedAt: new Date().toISOString() })
}

export async function flushWriteQueue(): Promise<void> {
  const entries = await getWriteQueue()
  for (const entry of entries) {
    try {
      if (entry.resource === 'inventory') {
        if (entry.operation === 'create') {
          await apiFetch('/api/items/create', { method: 'POST', body: JSON.stringify(entry.payload) })
        } else if (entry.operation === 'update' && entry.resourceId) {
          await apiFetch(`/api/inventory/${entry.resourceId}`, { method: 'PUT', body: JSON.stringify(entry.payload) })
        } else if (entry.operation === 'delete' && entry.resourceId) {
          await apiFetch(`/api/inventory/${entry.resourceId}`, { method: 'DELETE' })
        }
      } else if (entry.resource === 'categories') {
        if (entry.operation === 'create') {
          await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(entry.payload) })
        } else if (entry.operation === 'update' && entry.resourceId) {
          await apiFetch(`/api/categories/${entry.resourceId}`, { method: 'PUT', body: JSON.stringify(entry.payload) })
        } else if (entry.operation === 'delete' && entry.resourceId) {
          await apiFetch(`/api/categories/${entry.resourceId}`, { method: 'DELETE' })
        }
      } else if (entry.resource === 'config') {
        await apiFetch('/api/config', { method: 'PUT', body: JSON.stringify(entry.payload) })
      }
      await dequeueWrite(entry.id)
    } catch {
      // Stop flushing on first error — preserve queue order
      break
    }
  }
}
