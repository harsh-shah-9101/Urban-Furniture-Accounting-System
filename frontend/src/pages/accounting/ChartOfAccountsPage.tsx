import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/features/accounts/hooks'
import type { Account } from '@/types/accounting'

const TYPE_LABELS: Record<Account['type'], string> = {
  asset: 'Asset',
  liability: 'Liability',
  income: 'Income',
  expense: 'Expense',
  capital: 'Capital',
}

export function ChartOfAccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts()
  const navigate = useNavigate()

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
          <Button onClick={() => navigate('/accounting/chart-of-accounts/new')}>New Account</Button>
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
