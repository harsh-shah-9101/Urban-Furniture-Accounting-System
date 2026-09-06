import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
import { AnalyticAccountForm } from '@/features/budgets/analytic-accounts/components/AnalyticAccountForm'
import {
  useAnalyticAccount,
  useCreateAnalyticAccount,
  useDeleteAnalyticAccount,
  useUpdateAnalyticAccount,
} from '@/features/budgets/analytic-accounts/hooks'
import type { AnalyticAccountFormValues } from '@/features/budgets/analytic-accounts/schema'

function CreateAnalyticAccount() {
  const navigate = useNavigate()
  const createAccount = useCreateAnalyticAccount()

  function handleSubmit(values: AnalyticAccountFormValues) {
    createAccount.mutate(
      { ...values, description: values.description || null },
      { onSuccess: (created) => navigate(`/budgets/analytic-accounts/${created.id}`) },
    )
  }

  return (
    <div>
      <PageHeader title="New Analytic Account" backTo="/budgets/analytic-accounts" />
      <AnalyticAccountForm onSubmit={handleSubmit} isSubmitting={createAccount.isPending} />
    </div>
  )
}

function AnalyticAccountDetail({ id }: { id: number }) {
  const navigate = useNavigate()
  const { data: account, isLoading, isError } = useAnalyticAccount(id)
  const updateAccount = useUpdateAnalyticAccount(id)
  const deleteAccount = useDeleteAnalyticAccount()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  if (isLoading) return <LoadingState rows={2} />
  if (isError || !account) return <ErrorState message="Analytic account not found." />

  function handleSubmit(values: AnalyticAccountFormValues) {
    updateAccount.mutate(
      { ...values, description: values.description || null },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  return (
    <div>
      <PageHeader
        title={account.name}
        backTo="/budgets/analytic-accounts"
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
        <AnalyticAccountForm
          defaultValues={{
            name: account.name,
            code: account.code,
            description: account.description ?? '',
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateAccount.isPending}
        />
      ) : (
        <Card className="max-w-lg">
          <CardContent className="flex flex-col gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Code</div>
              <div className="text-sm">{account.code}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Description</div>
              <div className="text-sm">{account.description ?? '—'}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Delete ${account.name}?`}
        description="This permanently removes the analytic account. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          deleteAccount.mutate(account.id, {
            onSuccess: () => navigate('/budgets/analytic-accounts'),
          })
        }
      />
    </div>
  )
}

export function AnalyticAccountFormPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <AnalyticAccountDetail id={Number(id)} /> : <CreateAnalyticAccount />
}
