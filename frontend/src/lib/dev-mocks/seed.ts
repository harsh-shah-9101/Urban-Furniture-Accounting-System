import { createCollection } from './store'
import { analyticAccountsSeed } from './seed-data/analytic-accounts'

import type { AnalyticAccount } from '@/types/accounting'
import type { SalesOrder, CustomerInvoice } from '@/types/sales'
import type { Payment } from '@/types/payments'
import type { Budget } from '@/types/budgets'

export const analyticAccountsCollection = createCollection<AnalyticAccount>(
  'analytic-accounts',
  analyticAccountsSeed,
)

export const salesOrdersCollection = createCollection<SalesOrder>('sales-orders', [])
export const customerInvoicesCollection = createCollection<CustomerInvoice>(
  'customer-invoices',
  [],
)
export const paymentsCollection = createCollection<Payment>('payments', [])
export const budgetsCollection = createCollection<Budget>('budgets', [])
