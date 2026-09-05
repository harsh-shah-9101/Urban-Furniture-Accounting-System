/**
 * Tracks invoices "paid" through the mock UPI flow (see mock-payment.ts for why it can't
 * write this back to the backend). Persisted to localStorage — scoped to this browser only,
 * not shared with the backend or other sessions/devices — so the customer keeps seeing
 * "Paid" for invoices they've simulated payment on, even across polling refetches or a
 * page reload, without the real "posted" status from the server flipping it back.
 */

const STORAGE_KEY = 'ufa:mock-paid-invoices'

function readIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [])
  } catch {
    return new Set()
  }
}

function writeIds(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Best-effort only — a private window or blocked storage just means the badge
    // won't persist across reloads, which is a harmless degradation here.
  }
}

export function markInvoicePaidLocally(invoiceId: number) {
  const ids = readIds()
  ids.add(invoiceId)
  writeIds(ids)
}

export function isInvoicePaidLocally(invoiceId: number): boolean {
  return readIds().has(invoiceId)
}
