import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AnalyticAccountForm } from '@/features/budgets/analytic-accounts/components/AnalyticAccountForm'
import { useAnalyticAccount, useCreateAnalyticAccount } from '@/features/budgets/analytic-accounts/hooks'
import type { AnalyticAccountFormValues } from '@/features/budgets/analytic-accounts/schema'

const TYPE_LABELS = { income: 'Income', expense: 'Expenses' } as const

function CreateAnalyticAccount() {
  const navigate = useNavigate()
  const createAccount = useCreateAnalyticAccount()

  function handleSubmit(values: AnalyticAccountFormValues) {
    createAccount.mutate(values, {
      onSuccess: (created) => navigate(`/budgets/analytic-accounts/${created.id}`),
    })
  }

  return (
    <div>
      <PageHeader title="New Analytic Account" backTo="/budgets/analytic-accounts" />
      <AnalyticAccountForm onSubmit={handleSubmit} isSubmitting={createAccount.isPending} />
    </div>
  )
}

function AnalyticAccountDetail({ id }: { id: string }) {
  const { data: account, isLoading, isError } = useAnalyticAccount(id)

  if (isLoading) return <LoadingState rows={2} />
  if (isError || !account) return <ErrorState message="Analytic account not found." />

  return (
    <div>
      <PageHeader title={account.name} backTo="/budgets/analytic-accounts" />
      <Card className="max-w-lg">
        <CardContent>
          <Badge variant="secondary" className="w-fit">
            {TYPE_LABELS[account.type]}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export function AnalyticAccountFormPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <AnalyticAccountDetail id={id} /> : <CreateAnalyticAccount />
}
