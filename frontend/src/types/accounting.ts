import type { ID, Timestamped } from './common'

export type AccountType = 'asset' | 'liability' | 'income' | 'expense' | 'capital'

export interface Account {
  id: number
  code: string
  name: string
  type: AccountType
}

export type AccountInput = Omit<Account, 'id'>

export type JournalType = 'sales' | 'purchase' | 'bank' | 'cash' | 'general'

export interface Journal {
  id: number
  name: string
  type: JournalType
  defaultDebitAccountId: number | null
  defaultCreditAccountId: number | null
}

export type JournalInput = Omit<Journal, 'id'>

export interface JournalEntryLine {
  id: number
  accountId: number
  partnerId: number | null
  debit: number
  credit: number
}

export interface JournalEntry {
  id: number
  journalId: number
  reference: string
  status: string
  lines: JournalEntryLine[]
}

export type AnalyticAccountType = 'income' | 'expense'

export interface AnalyticAccount extends Timestamped {
  id: ID
  name: string
  type: AnalyticAccountType
  archived: boolean
}

export type AnalyticAccountInput = Omit<
  AnalyticAccount,
  'id' | 'createdAt' | 'updatedAt' | 'archived'
>
