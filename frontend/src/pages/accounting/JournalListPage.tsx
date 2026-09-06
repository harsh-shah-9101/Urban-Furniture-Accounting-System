import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useJournals, useCreateJournal, useUpdateJournal, useDeleteJournal } from '@/features/journals/hooks'
import { useAccounts } from '@/features/accounts/hooks'
import { defaultAccountIdFor } from '@/features/journals/defaultAccount'
import { JournalForm } from '@/features/journals/components/JournalForm'
import type { Journal } from '@/types/accounting'
import type { JournalFormValues } from '@/features/journals/schema'

const TYPE_LABELS: Record<Journal['type'], string> = {
  sales: 'Sales',
  purchase: 'Purchase',
  bank: 'Bank',
  cash: 'Cash',
  general: 'General',
}

function toJournalInput(values: JournalFormValues) {
  return {
    ...values,
    defaultDebitAccountId: values.defaultDebitAccountId || null,
    defaultCreditAccountId: values.defaultCreditAccountId || null,
  }
}

function EditJournalDialog({ journal, onClose }: { journal: Journal; onClose: () => void }) {
  const updateJournal = useUpdateJournal(journal.id)

  function handleSubmit(values: JournalFormValues) {
    updateJournal.mutate(toJournalInput(values), { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Journal</DialogTitle>
        </DialogHeader>
        <JournalForm
          defaultValues={{
            name: journal.name,
            type: journal.type,
            defaultDebitAccountId: journal.defaultDebitAccountId,
            defaultCreditAccountId: journal.defaultCreditAccountId,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateJournal.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}

export function JournalListPage() {
  const { data: journals, isLoading, isError } = useJournals()
  const { data: accounts } = useAccounts()
  const createJournal = useCreateJournal()
  const deleteJournal = useDeleteJournal()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null)
  const [deletingJournal, setDeletingJournal] = useState<Journal | null>(null)

  function handleCreateSubmit(values: JournalFormValues) {
    createJournal.mutate(toJournalInput(values), {
      onSuccess: () => {
        setIsCreateOpen(false)
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
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Edit"
            onClick={() => setEditingJournal(row.original)}
          >
            <span className="sr-only">Edit</span>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
            onClick={() => setDeletingJournal(row.original)}
          >
            <span className="sr-only">Delete</span>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Journals"
        description="Sales, Purchase, Bank, and Cash journals"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Journal
                </Button>
              }
            />
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

      {editingJournal && (
        <EditJournalDialog journal={editingJournal} onClose={() => setEditingJournal(null)} />
      )}

      <ConfirmDialog
        open={deletingJournal !== null}
        onOpenChange={(open) => !open && setDeletingJournal(null)}
        title={`Delete ${deletingJournal?.name}?`}
        description="This permanently removes the journal. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deletingJournal) deleteJournal.mutate(deletingJournal.id)
        }}
      />
    </div>
  )
}
