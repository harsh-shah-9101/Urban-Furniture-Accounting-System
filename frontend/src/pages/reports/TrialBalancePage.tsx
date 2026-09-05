import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ReportLayout } from '@/components/layout/ReportLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTrialBalance } from '@/features/reports/hooks'

export function TrialBalancePage() {
  const { data: lines, isLoading, isError } = useTrialBalance()

  return (
    <ReportLayout title="Trial Balance" subtitle="For the current accounting period">
      {isLoading && <LoadingState rows={5} />}
      {isError && <ErrorState message="Failed to load trial balance." />}
      {lines && lines.length === 0 && (
        <div className="py-12">
          <EmptyState title="No ledger activity yet" description="Post journal entries to see account balances here." />
        </div>
      )}

      {lines && lines.length > 0 && (
        <div className="mt-4 border-t-2 border-border pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.accountId}>
                    <TableCell>{line.code}</TableCell>
                    <TableCell>{line.name}</TableCell>
                    <TableCell className="capitalize">{line.accountType}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={line.debit} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={line.credit} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyText amount={line.balance} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      )}
    </ReportLayout>
  )
}
