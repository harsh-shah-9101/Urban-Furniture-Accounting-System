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
import { useAccounts, useCreateAccount } from '@/features/accounts/hooks'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import type { Account } from '@/types/accounting'
import type { AccountFormValues } from '@/features/accounts/schema'
import { useState } from 'react'

const TYPE_LABELS: Record<Account['type'], string> = {
  asset: 'Asset',
  liability: 'Liability',
  income: 'Income',
  expense: 'Expense',
  capital: 'Capital',
}

export function ChartOfAccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts()
  const createAccount = useCreateAccount()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleCreateSubmit(values: AccountFormValues) {
    createAccount.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false)
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
  ]

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="Master list of ledger accounts"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Account
              </Button>
            </DialogTrigger>
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
    </div>
  )
}
