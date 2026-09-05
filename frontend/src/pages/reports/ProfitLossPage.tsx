import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useProfitLoss, useTrialBalance } from '@/features/reports/hooks'
import type { TrialBalanceLine } from '@/types/reports'

function ProfitLossSection({ title, lines, total }: { title: string; lines: TrialBalanceLine[]; total: number }) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts with activity.</p>
        ) : (
          <div className="flex flex-col">
            {lines.map((line) => (
              <div key={line.accountId} className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
                <span className="text-muted-foreground">
                  <span className="mr-2 font-mono text-xs">{line.code}</span>
                  {line.name}
                </span>
                <CurrencyText amount={line.balance} className="font-medium" />
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t pt-3 text-base font-semibold">
          <span>Total {title}</span>
          <CurrencyText amount={total} />
        </div>
      </CardContent>
    </Card>
  )
}

export function ProfitLossPage() {
  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = useProfitLoss()
  const { data: lines, isLoading: isLinesLoading, isError: isLinesError } = useTrialBalance()

  const isLoading = isSummaryLoading || isLinesLoading
  const isError = isSummaryError || isLinesError

  const grouped = useMemo(() => {
    const income: TrialBalanceLine[] = []
    const expense: TrialBalanceLine[] = []
    for (const line of lines ?? []) {
      if (line.accountType === 'income') income.push(line)
      else if (line.accountType === 'expense') expense.push(line)
    }
    return { income, expense }
  }, [lines])

  const cards = summary
    ? [
        { label: 'Income', value: summary.income },
        { label: 'Expense', value: summary.expense },
        { label: 'Net Profit', value: summary.netProfit },
      ]
    : []

  return (
    <div>
      <PageHeader title="Profit & Loss" />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load profit & loss." />}

      {summary && lines && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

          {lines.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No ledger activity yet" description="Post journal entries to see the detailed profit & loss here." />
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-col gap-4 lg:flex-row">
                <ProfitLossSection title="Income" lines={grouped.income} total={summary.income} />
                <ProfitLossSection title="Expense" lines={grouped.expense} total={summary.expense} />
              </div>

              <Card className="mt-4">
                <CardContent className="flex items-center justify-between py-4 text-base font-semibold">
                  <span>Net Profit</span>
                  <CurrencyText amount={summary.netProfit} />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
