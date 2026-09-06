import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { useBudgets } from '@/features/budgets/budgets/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import type { Budget } from '@/types/budgets'

export function BudgetListPage() {
  const { data: budgets, isLoading, isError } = useBudgets()
  const { data: analyticAccounts } = useAnalyticAccounts()
  const navigate = useNavigate()

  const analyticAccountName = (id: number | null) =>
    analyticAccounts?.find((account) => account.id === id)?.name ?? (id !== null ? `Account ${id}` : '—')

  const columns: ColumnDef<Budget, unknown>[] = [
    { accessorKey: 'name', header: 'Budget Name' },
    {
      id: 'analyticAccount',
      header: 'Analytic Account',
      cell: ({ row }) => analyticAccountName(row.original.analyticAccountId),
    },
    {
      id: 'period',
      header: 'Period',
      cell: ({ row }) =>
        row.original.startDate && row.original.endDate
          ? `${formatDate(row.original.startDate)} – ${formatDate(row.original.endDate)}`
          : '—',
    },
    {
      id: 'budgetAmount',
      header: 'Budget',
      cell: ({ row }) => <CurrencyText amount={row.original.budgetAmount} />,
    },
    {
      id: 'spentAmount',
      header: 'Spent',
      cell: ({ row }) => <CurrencyText amount={row.original.spentAmount} />,
    },
    {
      id: 'remainingAmount',
      header: 'Remaining',
      cell: ({ row }) => (
        <CurrencyText
          amount={row.original.remainingAmount}
          className={cn(row.original.remainingAmount < 0 && 'text-destructive')}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Track planned amounts by period and analytic account"
        actions={<Button onClick={() => navigate('/budgets/new')}>New Budget</Button>}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load budgets." />}
      {budgets && (
        <DataTable
          columns={columns}
          data={budgets}
          searchPlaceholder="Search budgets..."
          onRowClick={(budget) => navigate(`/budgets/${budget.id}`)}
          emptyTitle="No budgets yet"
          emptyDescription="Create a budget to start tracking planned income or expenses."
        />
      )}
    </div>
  )
}
