import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useBalanceSheet, useTrialBalance } from '@/features/reports/hooks'
import type { TrialBalanceLine } from '@/types/reports'

function BalanceSheetSection({
  title,
  lines,
  extraLine,
  total,
}: {
  title: string
  lines: TrialBalanceLine[]
  extraLine?: { label: string; amount: number }
  total: number
}) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 && !extraLine ? (
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
            {extraLine && (
              <div className="flex items-center justify-between border-b py-2 text-sm last:border-b-0">
                <span className="text-muted-foreground italic">{extraLine.label}</span>
                <CurrencyText amount={extraLine.amount} className="font-medium" />
              </div>
            )}
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

export function BalanceSheetPage() {
  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = useBalanceSheet()
  const { data: lines, isLoading: isLinesLoading, isError: isLinesError } = useTrialBalance()

  const isLoading = isSummaryLoading || isLinesLoading
  const isError = isSummaryError || isLinesError

  const grouped = useMemo(() => {
    const assets: TrialBalanceLine[] = []
    const liabilities: TrialBalanceLine[] = []
    const capital: TrialBalanceLine[] = []
    for (const line of lines ?? []) {
      if (line.accountType === 'asset') assets.push(line)
      else if (line.accountType === 'liability') liabilities.push(line)
      else if (line.accountType === 'capital') capital.push(line)
    }
    return { assets, liabilities, capital }
  }, [lines])

  const cards = summary
    ? [
        { label: 'Assets', value: summary.assets },
        { label: 'Liabilities', value: summary.liabilities },
        { label: 'Capital', value: summary.capital },
        { label: 'Net Profit', value: summary.netProfit },
      ]
    : []

  return (
    <div>
      <PageHeader title="Balance Sheet" />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load balance sheet." />}

      {summary && lines && (
        <>
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

          <div className="mt-4">
            {Math.abs(summary.difference) < 0.01 ? (
              <Badge variant="outline" className="border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                Balanced
              </Badge>
            ) : (
              <Badge variant="outline" className="border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                Out of balance by <CurrencyText amount={summary.difference} className="ml-1" />
              </Badge>
            )}
          </div>

          {lines.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No ledger activity yet" description="Post journal entries to see the detailed balance sheet here." />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4 lg:flex-row">
              <BalanceSheetSection title="Assets" lines={grouped.assets} total={summary.assets} />
              <div className="flex flex-1 flex-col gap-4">
                <BalanceSheetSection title="Liabilities" lines={grouped.liabilities} total={summary.liabilities} />
                <BalanceSheetSection
                  title="Capital & Equity"
                  lines={grouped.capital}
                  extraLine={{ label: 'Current Year Earnings', amount: summary.netProfit }}
                  total={summary.capital + summary.netProfit}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
