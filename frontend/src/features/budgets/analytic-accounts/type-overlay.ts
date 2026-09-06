import type { AnalyticAccountType } from '@/types/accounting'

/**
 * The real backend's analytic-account record predates the Income/Expense "Type" field, so it
 * isn't guaranteed to accept or persist it. Type is tracked client-side instead — the same
 * localStorage-overlay approach used for the mock UPI payment flow (see
 * features/payments/mock-payment-store.ts) — so creating/editing an account never risks a
 * rejected request over a field the backend doesn't know about.
 */

const STORAGE_KEY = 'ufa:analytic-account-types'

function readMap(): Record<string, AnalyticAccountType> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, AnalyticAccountType>) : {}
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, AnalyticAccountType>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Best-effort only — worst case the type falls back to the default on next load.
  }
}

export function getAnalyticAccountType(id: number): AnalyticAccountType {
  return readMap()[String(id)] ?? 'expense'
}

export function setAnalyticAccountType(id: number, type: AnalyticAccountType) {
  const map = readMap()
  map[String(id)] = type
  writeMap(map)
}
