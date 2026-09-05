import { useMemo } from 'react'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ReportLayout } from '@/components/layout/ReportLayout'
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
    <div className="mb-8 last:mb-0">
      <h3 className="border-b-2 border-border pb-2 text-lg font-bold uppercase tracking-wide">{title}</h3>
      {lines.length === 0 && !extraLine ? (
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
          {extraLine && (
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="italic text-muted-foreground">{extraLine.label}</span>
              <CurrencyText amount={extraLine.amount} />
            </div>
          )}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-semibold">
        <span>Total {title}</span>
        <CurrencyText amount={total} />
      </div>
    </div>
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

  return (
    <ReportLayout title="Balance Sheet" subtitle="As of today">
      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load balance sheet." />}

      {summary && lines && (
        <>
          <div className="mb-8 text-right">
            {Math.abs(summary.difference) < 0.01 ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-700 print:border-black print:bg-transparent print:text-black">
                Balanced
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700 print:border-black print:bg-transparent print:text-black">
                Out of balance by <CurrencyText amount={summary.difference} className="ml-1" />
              </Badge>
            )}
          </div>

          {lines.length === 0 ? (
            <div className="py-12">
              <EmptyState title="No ledger activity yet" description="Post journal entries to see the detailed balance sheet here." />
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-12 lg:flex-row">
              <div className="flex-1">
                <BalanceSheetSection title="Assets" lines={grouped.assets} total={summary.assets} />
              </div>
              <div className="flex-1 flex flex-col gap-12">
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
    </ReportLayout>
  )
}
