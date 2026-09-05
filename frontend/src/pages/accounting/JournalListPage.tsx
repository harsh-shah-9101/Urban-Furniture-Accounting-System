import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useJournals } from '@/features/journals/hooks'
import { useAccounts } from '@/features/accounts/hooks'
import { defaultAccountIdFor } from '@/features/journals/defaultAccount'
import type { Journal } from '@/types/accounting'

const TYPE_LABELS: Record<Journal['type'], string> = {
  sales: 'Sales',
  purchase: 'Purchase',
  bank: 'Bank',
  cash: 'Cash',
  general: 'General',
}

export function JournalListPage() {
  const { data: journals, isLoading, isError } = useJournals()
  const { data: accounts } = useAccounts()
  const navigate = useNavigate()

  const columns: ColumnDef<Journal, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>,
    },
    {
      id: 'defaultAccount',
      header: 'Default Account',
      cell: ({ row }) => {
        const accountId = defaultAccountIdFor(
          row.original.type,
          row.original.defaultDebitAccountId,
          row.original.defaultCreditAccountId,
        )
        const account = accounts?.find((a) => a.id === accountId)
        if (!account) return <span className="text-muted-foreground">—</span>
        return `${account.code} — ${account.name}`
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Journals"
        description="Sales, Purchase, Bank, and Cash journals"
        actions={<Button onClick={() => navigate('/accounting/journals/new')}>New Journal</Button>}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load journals." />}
      {journals && (
        <DataTable
          columns={columns}
          data={journals}
          searchPlaceholder="Search journals..."
          emptyTitle="No journals yet"
          emptyDescription="Add your first journal to get started."
        />
      )}
    </div>
  )
}
