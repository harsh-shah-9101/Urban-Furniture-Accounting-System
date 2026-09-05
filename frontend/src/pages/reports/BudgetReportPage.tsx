import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/formatters'
import { useBudgetReport } from '@/features/reports/hooks'
import { useBudgets } from '@/features/budgets/budgets/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import type { Budget } from '@/types/budgets'
import type { AnalyticAccount } from '@/types/accounting'

function BudgetBreakdownTable({
  title,
  budgets,
  analyticAccounts,
  planned,
  comparisonLabel,
  comparisonValue,
  overIsBad = false,
}: {
  title: string
  budgets: Budget[]
  analyticAccounts: AnalyticAccount[]
  planned: number
  comparisonLabel: string
  comparisonValue: number
  /** For expense-style comparisons, planned exceeding the comparison value is the unfavorable direction. */
  overIsBad?: boolean
}) {
  const variance = planned - comparisonValue
  const isUnfavorable = overIsBad ? variance > 0 : variance < 0

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budgets in this category.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Budget</TableHead>
                <TableHead>Analytic Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead className="text-right">Planned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => {
                const accountName =
                  analyticAccounts.find((a) => a.id === budget.analyticAccountId)?.name ??
                  `Account ${budget.analyticAccountId}`
                return (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.name}</TableCell>
                    <TableCell>{accountName}</TableCell>
                    <TableCell>
                      {formatDate(budget.periodStart)} – {formatDate(budget.periodEnd)}
                    </TableCell>
                    <TableCell>{budget.responsiblePerson}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={budget.plannedAmount} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        <div className="mt-3 flex flex-col gap-1 border-t pt-3 text-sm">
          <div className="flex items-center justify-between font-semibold">
            <span>Total Planned</span>
            <CurrencyText amount={planned} />
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{comparisonLabel}</span>
            <CurrencyText amount={comparisonValue} />
          </div>
          <div className="flex items-center justify-between font-medium">
            <span>Variance</span>
            <CurrencyText amount={variance} className={isUnfavorable ? 'text-red-600 dark:text-red-400' : ''} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BudgetReportPage() {
  const [targetIncome, setTargetIncome] = useState(100000)
  const [budgetedExpense, setBudgetedExpense] = useState(60000)
  const { data, isLoading, isError } = useBudgetReport({ targetIncome, budgetedExpense })
  const { data: budgets, isLoading: isBudgetsLoading, isError: isBudgetsError } = useBudgets()
  const { data: analyticAccounts, isLoading: isAccountsLoading, isError: isAccountsError } = useAnalyticAccounts()

  const cards = data
    ? [
        { label: 'Target Income', value: data.targetIncome },
        { label: 'Actual Income', value: data.actualIncome },
        { label: 'Income Variance', value: data.incomeVariance },
        { label: 'Budgeted Expense', value: data.budgetedExpense },
        { label: 'Actual Expense', value: data.actualExpense },
        { label: 'Expense Variance', value: data.expenseVariance },
        { label: 'Net Profit', value: data.netProfit },
      ]
    : []

  const grouped = useMemo(() => {
    const incomeBudgets: Budget[] = []
    const expenseBudgets: Budget[] = []
    for (const budget of budgets ?? []) {
      const account = analyticAccounts?.find((a) => a.id === budget.analyticAccountId)
      if (account?.type === 'expense') expenseBudgets.push(budget)
      else incomeBudgets.push(budget)
    }
    return {
      incomeBudgets,
      expenseBudgets,
      plannedIncome: incomeBudgets.reduce((sum, b) => sum + b.plannedAmount, 0),
      plannedExpense: expenseBudgets.reduce((sum, b) => sum + b.plannedAmount, 0),
    }
  }, [budgets, analyticAccounts])

  const isBreakdownLoading = isBudgetsLoading || isAccountsLoading
  const isBreakdownError = isBudgetsError || isAccountsError

  return (
    <div>
      <PageHeader title="Budget Report" />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Target Income
          <CurrencyInput value={targetIncome} onChange={setTargetIncome} className="w-40" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Budgeted Expense
          <CurrencyInput value={budgetedExpense} onChange={setBudgetedExpense} className="w-40" />
        </label>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load budget report." />}

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardHeader>
                <CardTitle className="text-base">{card.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                <CurrencyText amount={card.value} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Budget Breakdown</h2>

        {isBreakdownLoading && <LoadingState rows={3} />}
        {isBreakdownError && <ErrorState message="Failed to load budgets." />}

        {budgets && analyticAccounts && budgets.length === 0 && (
          <EmptyState title="No budgets yet" description="Create a budget to see it broken down here." />
        )}

        {budgets && analyticAccounts && budgets.length > 0 && (
          <div className="flex flex-col gap-4 lg:flex-row">
            <BudgetBreakdownTable
              title="Income Budgets"
              budgets={grouped.incomeBudgets}
              analyticAccounts={analyticAccounts}
              planned={grouped.plannedIncome}
              comparisonLabel="Target Income"
              comparisonValue={targetIncome}
            />
            <BudgetBreakdownTable
              title="Expense Budgets"
              budgets={grouped.expenseBudgets}
              analyticAccounts={analyticAccounts}
              planned={grouped.plannedExpense}
              comparisonLabel="Budgeted Expense"
              comparisonValue={budgetedExpense}
              overIsBad
            />
          </div>
        )}
      </div>
    </div>
  )
}
