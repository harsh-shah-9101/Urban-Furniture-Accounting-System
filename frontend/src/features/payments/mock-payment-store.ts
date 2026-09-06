/**
 * Fallback only: the mock UPI flow (see mock-payment.ts and hooks.ts) now records a real
 * payment on the backend once the simulated wait completes. This local flag only kicks in
 * when that call fails — e.g. the backend hasn't rolled out the customer-portal pay route yet
 * — so the customer still sees "Paid" and the payment in their history in this browser,
 * rather than the flow silently doing nothing.
 */

export interface MockPaymentRecord {
  invoiceId: number
  amount: number
  reference: string
  paidAt: string
}

const STORAGE_KEY = 'ufa:mock-paid-invoices'

function readRecords(): MockPaymentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is MockPaymentRecord =>
        !!item && typeof item === 'object' && typeof (item as MockPaymentRecord).invoiceId === 'number'
    )
  } catch {
    return []
  }
}

function writeRecords(records: MockPaymentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Best-effort only — a private window or blocked storage just means the badge/history
    // won't persist across reloads, which is a harmless degradation here.
  }
}

export function markInvoicePaidLocally(invoiceId: number, amount: number, reference: string) {
  const records = readRecords().filter((r) => r.invoiceId !== invoiceId)
  records.push({ invoiceId, amount, reference, paidAt: new Date().toISOString() })
  writeRecords(records)
}

export function isInvoicePaidLocally(invoiceId: number): boolean {
  return readRecords().some((r) => r.invoiceId === invoiceId)
}

export function getLocalPaidPayments(): MockPaymentRecord[] {
  return readRecords()
}
