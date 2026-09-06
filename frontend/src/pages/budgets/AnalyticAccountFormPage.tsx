import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { AnalyticAccountForm } from '@/features/budgets/analytic-accounts/components/AnalyticAccountForm'
import {
  useAnalyticAccount,
  useCreateAnalyticAccount,
  useDeleteAnalyticAccount,
  useUpdateAnalyticAccount,
} from '@/features/budgets/analytic-accounts/hooks'
import { useBudgets } from '@/features/budgets/budgets/hooks'
import { useCustomerInvoices } from '@/features/sales/hooks'
import { useVendorBills } from '@/features/purchases/hooks'
import { computeAchieved } from '@/features/budgets/budgets/achieved'
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
  const { data: budgets } = useBudgets()
  const { data: invoices } = useCustomerInvoices()
  const { data: bills } = useVendorBills()
  const updateAccount = useUpdateAnalyticAccount(id)
  const deleteAccount = useDeleteAnalyticAccount()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  if (isLoading) return <LoadingState rows={2} />
  if (isError || !account) return <ErrorState message="Analytic account not found." />

  const usedInBudgets = (budgets ?? []).flatMap((budget) => {
    const line = budget.lines.find((l) => l.analyticAccountId === id)
    if (!line) return []
    const achieved =
      budget.status === 'draft'
        ? 0
        : computeAchieved({
            analyticAccountId: id,
            accountType: account.type,
            startDate: budget.startDate,
            endDate: budget.endDate,
            invoices,
            bills,
          }).total
    return [{ budget, committed: line.committedAmount, achieved }]
  })

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
            type: account.type,
            description: account.description ?? '',
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateAccount.isPending}
        />
      ) : (
        <div className="flex max-w-2xl flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Code</div>
                <div className="text-sm">{account.code}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Type</div>
                <Badge
                  variant="outline"
                  className={
                    account.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  }
                >
                  {account.type === 'income' ? 'Income' : 'Expense'}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Description</div>
                <div className="text-sm">{account.description ?? '—'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="text-sm font-medium">Budgets using this account</div>
              {usedInBudgets.length === 0 ? (
                <EmptyState
                  title="Not used in any budget yet"
                  description="Add this analytic account to a budget line to see it listed here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Budget</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Committed</TableHead>
                      <TableHead className="text-right">Achieved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usedInBudgets.map(({ budget, committed, achieved }) => (
                      <TableRow
                        key={budget.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/budgets/${budget.id}`)}
                      >
                        <TableCell>{budget.name}</TableCell>
                        <TableCell>{budget.startDate ? formatDate(budget.startDate) : '—'}</TableCell>
                        <TableCell>{budget.endDate ? formatDate(budget.endDate) : '—'}</TableCell>
                        <TableCell>
                          <StatusBadge status={budget.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyText amount={committed} />
                        </TableCell>
                        <TableCell className="text-right">
                          {budget.status === 'draft' ? '—' : <CurrencyText amount={achieved} />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
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
