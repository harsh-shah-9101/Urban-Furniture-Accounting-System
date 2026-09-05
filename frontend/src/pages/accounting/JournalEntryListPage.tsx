import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useJournalEntries } from '@/features/journal-entries/hooks'
import { useJournals } from '@/features/journals/hooks'
import { useAccounts } from '@/features/accounts/hooks'

export function JournalEntryListPage() {
  const { data: entries, isLoading, isError } = useJournalEntries()
  const { data: journals } = useJournals()
  const { data: accounts } = useAccounts()

  const journalName = (id: number) => journals?.find((j) => j.id === id)?.name ?? `Journal #${id}`
  const accountLabel = (id: number) => {
    const account = accounts?.find((a) => a.id === id)
    return account ? `${account.code} — ${account.name}` : `Account #${id}`
  }

  return (
    <div>
      <PageHeader
        title="Journal Entries"
        description="Double-entry accounting records, generated automatically when vendor bills are posted"
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load journal entries." />}
      {entries && entries.length === 0 && (
        <EmptyState
          title="No journal entries yet"
          description="Entries appear here once a vendor bill is posted."
        />
      )}

      <div className="flex flex-col gap-4">
        {entries?.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {entry.reference} — {journalName(entry.journalId)}
              </CardTitle>
              <StatusBadge status={entry.status} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{accountLabel(line.accountId)}</TableCell>
                      <TableCell className="text-right">
                        {line.debit > 0 ? <CurrencyText amount={line.debit} /> : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.credit > 0 ? <CurrencyText amount={line.credit} /> : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
