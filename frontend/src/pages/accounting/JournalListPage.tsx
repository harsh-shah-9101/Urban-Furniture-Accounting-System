import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { useJournals, useCreateJournal } from '@/features/journals/hooks'
import { useAccounts } from '@/features/accounts/hooks'
import { defaultAccountIdFor } from '@/features/journals/defaultAccount'
import { JournalForm } from '@/features/journals/components/JournalForm'
import type { Journal } from '@/types/accounting'
import type { JournalFormValues } from '@/features/journals/schema'
import { useState } from 'react'

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
  const createJournal = useCreateJournal()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleCreateSubmit(values: JournalFormValues) {
    const input = {
      ...values,
      defaultDebitAccountId: values.defaultDebitAccountId || null,
      defaultCreditAccountId: values.defaultCreditAccountId || null,
    }
    createJournal.mutate(input, {
      onSuccess: () => {
        setIsDialogOpen(false)
      },
    })
  }

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
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Journal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Journal</DialogTitle>
              </DialogHeader>
              <JournalForm onSubmit={handleCreateSubmit} isSubmitting={createJournal.isPending} />
            </DialogContent>
          </Dialog>
        }
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
