import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent } from '@/components/ui/card'
import { BudgetForm } from '@/features/budgets/budgets/components/BudgetForm'
import { useBudget, useCreateBudget } from '@/features/budgets/budgets/hooks'
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

function BudgetDetail({ id }: { id: string }) {
  const { data: budget, isLoading, isError } = useBudget(id)
  const { data: analyticAccounts } = useAnalyticAccounts()

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !budget) return <ErrorState message="Budget not found." />

  const analyticAccountName =
    analyticAccounts?.find((account) => account.id === budget.analyticAccountId)?.name ??
    `Analytic Account ${budget.analyticAccountId}`

  const fields: [string, string][] = [
    ['Analytic Account', analyticAccountName],
    ['Period', `${budget.periodStart} to ${budget.periodEnd}`],
    ['Responsible Person', budget.responsiblePerson],
  ]

  return (
    <div>
      <PageHeader title={budget.name} backTo="/budgets" />
      <Card className="max-w-lg">
        <CardContent className="flex flex-col gap-3">
          {fields.map(([label, value]) => (
            <div key={label}>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-sm">{value}</div>
            </div>
          ))}
          <div>
            <div className="text-xs text-muted-foreground">Planned Amount</div>
            <div className="text-sm">
              <CurrencyText amount={budget.plannedAmount} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function BudgetFormPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <BudgetDetail id={id} /> : <CreateBudget />
}
