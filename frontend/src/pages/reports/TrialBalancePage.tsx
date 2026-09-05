import { PageHeader } from '@/components/layout/PageHeader'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTrialBalance } from '@/features/reports/hooks'

export function TrialBalancePage() {
  const { data: lines, isLoading, isError } = useTrialBalance()

  return (
    <div>
      <PageHeader title="Trial Balance" />

      {isLoading && <LoadingState rows={5} />}
      {isError && <ErrorState message="Failed to load trial balance." />}
      {lines && lines.length === 0 && (
        <EmptyState title="No ledger activity yet" description="Post journal entries to see account balances here." />
      )}

      {lines && lines.length > 0 && (
        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
