export type AccountType = 'asset' | 'liability' | 'income' | 'expense' | 'capital'

export interface Account {
  id: number
  code: string
  name: string
  type: AccountType
  archived: boolean
}

export type AccountInput = Omit<Account, 'id' | 'archived'>
export type AccountUpdateInput = Partial<AccountInput>

export type JournalType = 'sales' | 'purchase' | 'bank' | 'cash' | 'general'

export interface Journal {
  id: number
  name: string
  type: JournalType
  defaultDebitAccountId: number | null
  defaultCreditAccountId: number | null
  archived: boolean
}

export type JournalInput = Omit<Journal, 'id' | 'archived'>
export type JournalUpdateInput = Partial<JournalInput>

export interface JournalEntryLine {
  id: number
  accountId: number
  partnerId: number | null
  debit: number
  credit: number
}

export type JournalEntrySourceType = 'vendor_bill' | 'customer_invoice' | 'payment'

export interface JournalEntry {
  id: number
  journalId: number
  reference: string
  entryDate: string
  status: string
  sourceType: JournalEntrySourceType | null
  sourceId: number | null
  lines: JournalEntryLine[]
}

export interface AnalyticAccount {
  id: number
  name: string
  code: string
  description: string | null
  archived: boolean
}

export type AnalyticAccountInput = Omit<AnalyticAccount, 'id' | 'archived'>
export type AnalyticAccountUpdateInput = Partial<AnalyticAccountInput>
