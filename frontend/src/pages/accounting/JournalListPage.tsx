import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useJournals } from '@/features/journals/hooks'
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
  const navigate = useNavigate()

  const columns: ColumnDef<Journal, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>,
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
