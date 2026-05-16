import type { Role } from '../../src/lib/types'
import type { VercelResponse } from '@vercel/node'

const ROLE_ORDER: Role[] = ['view', 'edit', 'full', 'manager']

export function hasRole(userRole: Role, minRole: Role): boolean {
  return ROLE_ORDER.indexOf(userRole) >= ROLE_ORDER.indexOf(minRole)
}

export function requireRole(userRole: Role, minRole: Role, res: VercelResponse): boolean {
  if (!hasRole(userRole, minRole)) {
    res.status(403).json({ error: 'Forbidden' })
    return false
  }
  return true
}
