import type { CustomerInvoice } from '@/types/sales'
import type { VendorBill } from '@/types/purchases'
import type { AnalyticAccount, AnalyticAccountType } from '@/types/accounting'
import type { Budget } from '@/types/budgets'

/**
 * "Achieved Amount" is never entered by a user or stored on a budget line — it's computed by
 * searching real Sales Invoices (for Income analytics) or Vendor Bills (for Expense analytics)
 * for lines tagged with the same analytic account, within the budget's period, and summing them.
 */

export interface AchievedSource {
  kind: 'invoice' | 'bill'
  id: number
  documentNo: string | null
  date: string
  amount: number
}

function inPeriod(date: string, startDate: string | null, endDate: string | null): boolean {
  if (startDate && date < startDate) return false
  if (endDate && date > endDate) return false
  return true
}

export function computeAchieved({
  analyticAccountId,
  accountType,
  startDate,
  endDate,
  invoices,
  bills,
}: {
  analyticAccountId: number
  accountType: AnalyticAccountType | undefined
  startDate: string | null
  endDate: string | null
  invoices: CustomerInvoice[] | undefined
  bills: VendorBill[] | undefined
}): { total: number; sources: AchievedSource[] } {
  const sources: AchievedSource[] = []

  if (accountType === 'income') {
    for (const invoice of invoices ?? []) {
      if (invoice.status === 'cancelled') continue
      if (!inPeriod(invoice.invoiceDate, startDate, endDate)) continue
      const amount = invoice.lines
        .filter((line) => line.analyticAccountId === analyticAccountId)
        .reduce((sum, line) => sum + line.lineTotal, 0)
      if (amount > 0) {
        sources.push({ kind: 'invoice', id: invoice.id, documentNo: invoice.invoiceNumber, date: invoice.invoiceDate, amount })
      }
    }
  } else if (accountType === 'expense') {
    for (const bill of bills ?? []) {
      if (bill.status === 'cancelled') continue
      if (!inPeriod(bill.billDate, startDate, endDate)) continue
      const amount = bill.lines
        .filter((line) => line.analyticAccountId === analyticAccountId)
        .reduce((sum, line) => sum + line.lineTotal, 0)
      if (amount > 0) {
        sources.push({ kind: 'bill', id: bill.id, documentNo: bill.billNumber, date: bill.billDate, amount })
      }
    }
  }

  return { total: sources.reduce((sum, source) => sum + source.amount, 0), sources }
}

export function computeBudgetAchievedTotal(
  budget: Pick<Budget, 'lines' | 'startDate' | 'endDate'>,
  analyticAccounts: AnalyticAccount[] | undefined,
  invoices: CustomerInvoice[] | undefined,
  bills: VendorBill[] | undefined,
): number {
  return budget.lines.reduce((sum, line) => {
    const accountType = analyticAccounts?.find((account) => account.id === line.analyticAccountId)?.type
    const { total } = computeAchieved({
      analyticAccountId: line.analyticAccountId,
      accountType,
      startDate: budget.startDate,
      endDate: budget.endDate,
      invoices,
      bills,
    })
    return sum + total
  }, 0)
}
