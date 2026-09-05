import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ReportLayout } from '@/components/layout/ReportLayout'
import { useProfitLoss, useTrialBalance } from '@/features/reports/hooks'
import type { TrialBalanceLine } from '@/types/reports'

function ProfitLossSection({ title, lines, total }: { title: string; lines: TrialBalanceLine[]; total: number }) {
  return (
    <div className="mb-8 last:mb-0">
      <h3 className="border-b-2 border-border pb-2 text-lg font-bold uppercase tracking-wide">{title}</h3>
      {lines.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground italic">No accounts with activity.</p>
      ) : (
        <div className="flex flex-col py-2">
          {lines.map((line) => (
            <div key={line.accountId} className="flex items-center justify-between py-1.5 text-sm">
              <span>
                <span className="mr-3 font-mono text-xs text-muted-foreground">{line.code}</span>
                {line.name}
              </span>
              <CurrencyText amount={line.balance} />
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-semibold">
        <span>Total {title}</span>
        <CurrencyText amount={total} />
      </div>
    </div>
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

  return (
    <ReportLayout title="Profit & Loss" subtitle="For the current accounting period">
      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load profit & loss." />}

      {summary && lines && (
        <>
          {lines.length === 0 ? (
            <div className="py-12">
              <EmptyState title="No ledger activity yet" description="Post journal entries to see the detailed profit & loss here." />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl pt-4">
              <ProfitLossSection title="Operating Income" lines={grouped.income} total={summary.income} />
              <ProfitLossSection title="Operating Expenses" lines={grouped.expense} total={summary.expense} />

              <div className="mt-12 flex items-center justify-between border-y-4 border-double border-border py-4 text-xl font-bold">
                <span className="uppercase tracking-wider">Net Profit</span>
                <CurrencyText amount={summary.netProfit} className="text-primary print:text-black" />
              </div>
            </div>
          )}
        </>
      )}
    </ReportLayout>
  )
}
