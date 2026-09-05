import type { Role } from '@/types/auth'

/**
 * Journal *definitions* (the Sales/Purchase/Bank/Cash journals themselves) are Admin-only —
 * everything else treats the Invoicing User as equal to Admin. Kept as a lookup table rather
 * than scattered checks so route guards and in-page action buttons agree on the same rules.
 */
export const canManageJournalDefinitions = (role: Role): boolean => role === 'admin'

export const isStaff = (role: Role): boolean => role === 'admin' || role === 'invoicing_user'
