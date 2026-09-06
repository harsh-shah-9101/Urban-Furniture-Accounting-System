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
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/features/accounts/hooks'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import type { Account } from '@/types/accounting'
import type { AccountFormValues } from '@/features/accounts/schema'

const TYPE_LABELS: Record<Account['type'], string> = {
  asset: 'Asset',
  liability: 'Liability',
  income: 'Income',
  expense: 'Expense',
  capital: 'Capital',
}

function EditAccountDialog({ account, onClose }: { account: Account; onClose: () => void }) {
  const updateAccount = useUpdateAccount(account.id)

  function handleSubmit(values: AccountFormValues) {
    updateAccount.mutate(values, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>
        <AccountForm
          defaultValues={{ code: account.code, name: account.name, type: account.type }}
          onSubmit={handleSubmit}
          isSubmitting={updateAccount.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}

export function ChartOfAccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts()
  const createAccount = useCreateAccount()
  const deleteAccount = useDeleteAccount()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)

  function handleCreateSubmit(values: AccountFormValues) {
    createAccount.mutate(values, {
      onSuccess: () => {
        setIsCreateOpen(false)
      },
    })
  }

  const columns: ColumnDef<Account, unknown>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Edit"
            onClick={() => setEditingAccount(row.original)}
          >
            <span className="sr-only">Edit</span>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
            onClick={() => setDeletingAccount(row.original)}
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
        title="Chart of Accounts"
        description="Master list of ledger accounts"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Account
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Account</DialogTitle>
              </DialogHeader>
              <AccountForm onSubmit={handleCreateSubmit} isSubmitting={createAccount.isPending} />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load accounts." />}
      {accounts && (
        <DataTable
          columns={columns}
          data={accounts}
          searchPlaceholder="Search accounts..."
          emptyTitle="No accounts yet"
          emptyDescription="Add your first ledger account to get started."
        />
      )}

      {editingAccount && (
        <EditAccountDialog account={editingAccount} onClose={() => setEditingAccount(null)} />
      )}

      <ConfirmDialog
        open={deletingAccount !== null}
        onOpenChange={(open) => !open && setDeletingAccount(null)}
        title={`Delete ${deletingAccount?.name}?`}
        description="This permanently removes the account. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deletingAccount) deleteAccount.mutate(deletingAccount.id)
        }}
      />
    </div>
  )
}
