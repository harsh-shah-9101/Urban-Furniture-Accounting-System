import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { ViewToggle, type DataViewMode } from '@/components/data-display/ViewToggle'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { useBudgets, useCreateBudget } from '@/features/budgets/budgets/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import { useCustomerInvoices } from '@/features/sales/hooks'
import { useVendorBills } from '@/features/purchases/hooks'
import { BudgetKanbanView } from '@/features/budgets/budgets/components/BudgetKanbanView'
import { BudgetPieMini } from '@/features/budgets/budgets/components/BudgetPieMini'
import { BudgetForm } from '@/features/budgets/budgets/components/BudgetForm'
import { computeBudgetAchievedTotal } from '@/features/budgets/budgets/achieved'
import { budgetCommittedTotal, type Budget } from '@/types/budgets'
import type { BudgetFormValues } from '@/features/budgets/budgets/schema'

const VIEW_STORAGE_KEY = 'budgets:view-mode'

function readStoredView(): DataViewMode {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY)
  return stored === 'kanban' ? 'kanban' : 'list'
}

export function BudgetListPage() {
  const { data: budgets, isLoading, isError } = useBudgets()
  const { data: analyticAccounts } = useAnalyticAccounts()
  const { data: invoices } = useCustomerInvoices()
  const { data: bills } = useVendorBills()
  const createBudget = useCreateBudget()
  const navigate = useNavigate()
  const [view, setView] = useState<DataViewMode>(readStoredView)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleViewChange(next: DataViewMode) {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  function handleCreateSubmit(values: BudgetFormValues) {
    createBudget.mutate(values, { onSuccess: () => setIsDialogOpen(false) })
  }

  const filteredBudgets = useMemo(() => {
    if (!budgets) return []
    const query = search.trim().toLowerCase()
    if (!query) return budgets
    return budgets.filter((budget) => budget.name.toLowerCase().includes(query))
  }, [budgets, search])

  const columns: ColumnDef<Budget, unknown>[] = [
    { accessorKey: 'name', header: 'Budget' },
    {
      id: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => (row.original.startDate ? formatDate(row.original.startDate) : '—'),
    },
    {
      id: 'endDate',
      header: 'End Date',
      cell: ({ row }) => (row.original.endDate ? formatDate(row.original.endDate) : '—'),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'pieChart',
      header: 'Pie Chart',
      cell: ({ row }) => (
        <BudgetPieMini
          committed={row.original.status === 'draft' ? 0 : budgetCommittedTotal(row.original)}
          achieved={
            row.original.status === 'draft'
              ? 0
              : computeBudgetAchievedTotal(row.original, analyticAccounts, invoices, bills)
          }
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Track committed vs achieved amounts by analytic account"
        backTo={true}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Budget
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>New Budget</DialogTitle>
              </DialogHeader>
              <BudgetForm onSubmit={handleCreateSubmit} isSubmitting={createBudget.isPending} />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load budgets." />}
      {budgets && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search budgets..."
                className="pl-9"
              />
            </div>
            <ViewToggle value={view} onChange={handleViewChange} />
          </div>

          {view === 'list' ? (
            <DataTable
              columns={columns}
              data={filteredBudgets}
              onRowClick={(budget) => navigate(`/budgets/${budget.id}`)}
              emptyTitle="No budgets yet"
              emptyDescription="Create a budget to start tracking committed and achieved amounts."
              searchValue={search}
              onSearchChange={setSearch}
              hideSearchInput
            />
          ) : (
            <BudgetKanbanView
              budgets={filteredBudgets}
              analyticAccounts={analyticAccounts}
              invoices={invoices}
              bills={bills}
              onSelect={(budget) => navigate(`/budgets/${budget.id}`)}
            />
          )}
        </div>
      )}
    </div>
  )
}
