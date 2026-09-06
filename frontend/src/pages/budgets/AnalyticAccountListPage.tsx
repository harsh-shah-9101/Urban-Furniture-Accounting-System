import { useState } from 'react'
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
import { useAnalyticAccounts, useCreateAnalyticAccount } from '@/features/budgets/analytic-accounts/hooks'
import { AnalyticAccountForm } from '@/features/budgets/analytic-accounts/components/AnalyticAccountForm'
import type { AnalyticAccount } from '@/types/accounting'
import type { AnalyticAccountFormValues } from '@/features/budgets/analytic-accounts/schema'

export function AnalyticAccountListPage() {
  const { data: accounts, isLoading, isError } = useAnalyticAccounts()
  const createAccount = useCreateAnalyticAccount()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleCreateSubmit(values: AnalyticAccountFormValues) {
    createAccount.mutate(
      { ...values, description: values.description || null },
      { onSuccess: () => setIsDialogOpen(false) },
    )
  }

  const columns: ColumnDef<AnalyticAccount, unknown>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.type === 'income'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          }
        >
          {row.original.type === 'income' ? 'Income' : 'Expense'}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.original.description ?? '—',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Analytic Accounts"
        description="Tag income/expenses by project or department"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Analytic Account
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Analytic Account</DialogTitle>
              </DialogHeader>
              <AnalyticAccountForm onSubmit={handleCreateSubmit} isSubmitting={createAccount.isPending} />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load analytic accounts." />}
      {accounts && (
        <DataTable
          columns={columns}
          data={accounts}
          searchPlaceholder="Search analytic accounts..."
          onRowClick={(account) => navigate(`/budgets/analytic-accounts/${account.id}`)}
          emptyTitle="No analytic accounts yet"
          emptyDescription="Create one to start tagging income or expenses by project or department."
        />
      )}
    </div>
  )
}
