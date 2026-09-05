import type { JournalType } from '@/types/accounting'

/**
 * Journal definitions expose a single "Default Account" to the user, but the backend
 * stores it as a debit/credit pair so it can be posted correctly on either journal type.
 * Sales journals only ever populate the credit side (income), Purchase only the debit
 * side (expense), and Bank/Cash journals use the same account on both sides since it
 * represents the journal's own account rather than an income/expense leg.
 */
export function accountFieldsForType(
  type: JournalType,
  accountId: number | null,
): { defaultDebitAccountId: number | null; defaultCreditAccountId: number | null } {
  switch (type) {
    case 'sales':
      return { defaultDebitAccountId: null, defaultCreditAccountId: accountId }
    case 'purchase':
      return { defaultDebitAccountId: accountId, defaultCreditAccountId: null }
    case 'bank':
    case 'cash':
      return { defaultDebitAccountId: accountId, defaultCreditAccountId: accountId }
    case 'general':
    default:
      return { defaultDebitAccountId: accountId, defaultCreditAccountId: null }
  }
}

export function defaultAccountIdFor(
  type: JournalType,
  defaultDebitAccountId: number | null,
  defaultCreditAccountId: number | null,
): number | null {
  switch (type) {
    case 'sales':
      return defaultCreditAccountId ?? defaultDebitAccountId
    case 'purchase':
      return defaultDebitAccountId ?? defaultCreditAccountId
    default:
      return defaultDebitAccountId ?? defaultCreditAccountId
  }
}
