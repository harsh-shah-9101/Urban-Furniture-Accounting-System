import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import type { AnalyticAccount } from '@/types/accounting'

export function AnalyticAccountListPage() {
  const { data: accounts, isLoading, isError } = useAnalyticAccounts()
  const navigate = useNavigate()

  const columns: ColumnDef<AnalyticAccount, unknown>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
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
          <Button onClick={() => navigate('/budgets/analytic-accounts/new')}>New Analytic Account</Button>
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
