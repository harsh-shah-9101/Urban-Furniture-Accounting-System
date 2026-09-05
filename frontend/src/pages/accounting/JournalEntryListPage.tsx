import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useJournalEntries } from '@/features/journal-entries/hooks'
import { useJournals } from '@/features/journals/hooks'
import { useAccounts } from '@/features/accounts/hooks'
import { useContacts } from '@/features/contacts/hooks'
import type { JournalEntry } from '@/types/accounting'

/** A balanced entry's debit and credit lines sum to the same figure — either works as the total. */
function entryTotal(entry: JournalEntry): number {
  const debitTotal = entry.lines.reduce((sum, line) => sum + line.debit, 0)
  return debitTotal > 0 ? debitTotal : entry.lines.reduce((sum, line) => sum + line.credit, 0)
}

/** Entries don't carry a partner of their own — take the first line that names one. */
function entryPartnerId(entry: JournalEntry): number | null {
  return entry.lines.find((line) => line.partnerId !== null)?.partnerId ?? null
}

export function JournalEntryListPage() {
  const { data: entries, isLoading, isError } = useJournalEntries()
  const { data: journals } = useJournals()
  const { data: accounts } = useAccounts()
  const { data: contacts } = useContacts()
  const [openEntry, setOpenEntry] = useState<JournalEntry | null>(null)

  const journalName = (id: number) => journals?.find((j) => j.id === id)?.name ?? `Journal ${id}`
  const accountLabel = (id: number) => {
    const account = accounts?.find((a) => a.id === id)
    return account ? `${account.code} — ${account.name}` : `Account ${id}`
  }
  const partnerLabel = (id: number | null) => {
    if (id === null) return '—'
    return contacts?.find((c) => c.id === id)?.name ?? `Contact ${id}`
  }

  const columns: ColumnDef<JournalEntry, unknown>[] = [
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => row.original.reference.replace(/#/g, ''),
    },
    {
      id: 'journal',
      header: 'Journal',
      cell: ({ row }) => journalName(row.original.journalId),
    },
    {
      id: 'partner',
      header: 'Partner',
      cell: ({ row }) => partnerLabel(entryPartnerId(row.original)),
    },
    {
      id: 'total',
      header: 'Total',
      cell: ({ row }) => <CurrencyText amount={entryTotal(row.original)} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Journal Entries"
        description="Double-entry accounting records, generated automatically when vendor bills, customer invoices, and payments are posted"
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load journal entries." />}
      {entries && (
        <DataTable
          columns={columns}
          data={entries}
          onRowClick={setOpenEntry}
          searchPlaceholder="Search journal entries..."
          emptyTitle="No journal entries yet"
          emptyDescription="Entries appear here once a vendor bill, invoice, or payment is posted."
        />
      )}

      <Dialog open={openEntry !== null} onOpenChange={(open) => !open && setOpenEntry(null)}>
        <DialogContent className="sm:max-w-lg">
          {openEntry && (
            <>
              <DialogHeader>
                <DialogTitle>{openEntry.reference.replace(/#/g, '')}</DialogTitle>
                <DialogDescription>{journalName(openEntry.journalId)}</DialogDescription>
              </DialogHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openEntry.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{accountLabel(line.accountId)}</TableCell>
                      <TableCell className="text-muted-foreground">{partnerLabel(line.partnerId)}</TableCell>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
