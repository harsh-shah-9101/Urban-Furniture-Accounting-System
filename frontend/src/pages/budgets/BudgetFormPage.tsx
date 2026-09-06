import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { BudgetForm } from '@/features/budgets/budgets/components/BudgetForm'
import { useBudget, useCreateBudget, useDeleteBudget, useUpdateBudget } from '@/features/budgets/budgets/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import type { BudgetFormValues } from '@/features/budgets/budgets/schema'

function CreateBudget() {
  const navigate = useNavigate()
  const createBudget = useCreateBudget()

  function handleSubmit(values: BudgetFormValues) {
    createBudget.mutate(values, { onSuccess: (created) => navigate(`/budgets/${created.id}`) })
  }

  return (
    <div>
      <PageHeader title="New Budget" backTo="/budgets" />
      <BudgetForm onSubmit={handleSubmit} isSubmitting={createBudget.isPending} />
    </div>
  )
}

function BudgetDetail({ id }: { id: number }) {
  const navigate = useNavigate()
  const { data: budget, isLoading, isError } = useBudget(id)
  const { data: analyticAccounts } = useAnalyticAccounts()
  const updateBudget = useUpdateBudget(id)
  const deleteBudget = useDeleteBudget()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !budget) return <ErrorState message="Budget not found." />

  const analyticAccountName =
    analyticAccounts?.find((account) => account.id === budget.analyticAccountId)?.name ??
    (budget.analyticAccountId !== null ? `Analytic Account ${budget.analyticAccountId}` : '—')

  const percentUsed = budget.budgetAmount > 0 ? (budget.spentAmount / budget.budgetAmount) * 100 : 0
  const isOverBudget = budget.remainingAmount < 0

  function handleSubmit(values: BudgetFormValues) {
    updateBudget.mutate(values, { onSuccess: () => setIsEditing(false) })
  }

  return (
    <div>
      <PageHeader
        title={budget.name}
        backTo="/budgets"
        actions={
          !isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )
        }
      />

      {isEditing ? (
        <BudgetForm
          defaultValues={{
            name: budget.name,
            analyticAccountId: budget.analyticAccountId ?? 0,
            budgetAmount: budget.budgetAmount,
            startDate: budget.startDate ?? '',
            endDate: budget.endDate ?? '',
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateBudget.isPending}
        />
      ) : (
        <Card className="max-w-lg">
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Analytic Account</div>
              <div className="text-sm">{analyticAccountName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Period</div>
              <div className="text-sm">
                {budget.startDate && budget.endDate
                  ? `${formatDate(budget.startDate)} to ${formatDate(budget.endDate)}`
                  : '—'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Budget</div>
                <div className="text-sm font-medium">
                  <CurrencyText amount={budget.budgetAmount} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Spent</div>
                <div className="text-sm font-medium">
                  <CurrencyText amount={budget.spentAmount} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Remaining</div>
                <div className={cn('text-sm font-medium', isOverBudget && 'text-destructive')}>
                  <CurrencyText amount={budget.remainingAmount} />
                </div>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', isOverBudget ? 'bg-destructive' : 'bg-primary')}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            {isOverBudget && (
              <p className="text-sm text-destructive">
                ⚠ Exceeds approved budget by <CurrencyText amount={Math.abs(budget.remainingAmount)} />.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Delete ${budget.name}?`}
        description="This permanently removes the budget. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteBudget.mutate(budget.id, { onSuccess: () => navigate('/budgets') })}
      />
    </div>
  )
}

export function BudgetFormPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <BudgetDetail id={Number(id)} /> : <CreateBudget />
}
