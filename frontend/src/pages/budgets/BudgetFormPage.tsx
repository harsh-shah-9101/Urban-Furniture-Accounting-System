import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Send, GitBranch, XCircle, Plus } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { BudgetForm } from '@/features/budgets/budgets/components/BudgetForm'
import { BudgetStatusStepper } from '@/features/budgets/budgets/components/BudgetStatusStepper'
import { AchievedSourcesDialog } from '@/features/budgets/budgets/components/AchievedSourcesDialog'
import { computeAchieved, type AchievedSource } from '@/features/budgets/budgets/achieved'
import {
  useBudget,
  useBudgets,
  useCancelBudget,
  useConfirmBudget,
  useCreateBudget,
  useDeleteBudget,
  useReviseBudget,
  useUpdateBudget,
} from '@/features/budgets/budgets/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import { useContacts } from '@/features/contacts/hooks'
import { useCustomerInvoices } from '@/features/sales/hooks'
import { useVendorBills } from '@/features/purchases/hooks'
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
  const { data: budgets } = useBudgets()
  const { data: analyticAccounts } = useAnalyticAccounts()
  const { data: contacts } = useContacts()
  const { data: invoices } = useCustomerInvoices()
  const { data: bills } = useVendorBills()
  const updateBudget = useUpdateBudget(id)
  const deleteBudget = useDeleteBudget()
  const confirmBudget = useConfirmBudget(id)
  const cancelBudget = useCancelBudget(id)
  const reviseBudget = useReviseBudget(id)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [achievedDialog, setAchievedDialog] = useState<{ name: string; sources: AchievedSource[] } | null>(null)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !budget) return <ErrorState message="Budget not found." />

  const accountName = (accountId: number) =>
    analyticAccounts?.find((account) => account.id === accountId)?.name ?? `Account ${accountId}`
  const accountType = (accountId: number) => analyticAccounts?.find((account) => account.id === accountId)?.type
  const contactName = (contactId: number | null) =>
    contactId === null ? '—' : contacts?.find((contact) => contact.id === contactId)?.name ?? `Contact ${contactId}`

  const revisionOf = budget.revisionOfId ? budgets?.find((b) => b.id === budget.revisionOfId) : undefined
  const revisedWith = budget.revisedWithId ? budgets?.find((b) => b.id === budget.revisedWithId) : undefined

  const canEdit = budget.status === 'draft'
  const canConfirm = budget.status === 'draft'
  const canRevise = budget.status === 'confirmed'
  const canCancel = budget.status === 'draft' || budget.status === 'confirmed'
  const showAchieved = budget.status !== 'draft'

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
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/budgets/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
              {canConfirm && (
                <Button onClick={() => confirmBudget.mutate()} disabled={confirmBudget.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  {confirmBudget.isPending ? 'Confirming...' : 'Confirm'}
                </Button>
              )}
              {canRevise && (
                <Button
                  variant="secondary"
                  disabled={reviseBudget.isPending}
                  onClick={() =>
                    reviseBudget.mutate(undefined, {
                      onSuccess: (revised) => navigate(`/budgets/${revised.id}`),
                    })
                  }
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  {reviseBudget.isPending ? 'Revising...' : 'Revise'}
                </Button>
              )}
              {canCancel && (
                <Button variant="destructive" onClick={() => setIsCancelOpen(true)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
              {canEdit && (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => setIsDeleteOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              <BudgetStatusStepper status={budget.status} />
            </div>
          )
        }
      />

      {isEditing ? (
        <BudgetForm
          defaultValues={{
            name: budget.name,
            startDate: budget.startDate ?? '',
            endDate: budget.endDate ?? '',
            responsibleContactId: budget.responsibleContactId ?? 0,
            lines: budget.lines.map((line) => ({
              analyticAccountId: line.analyticAccountId,
              committedAmount: line.committedAmount,
            })),
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateBudget.isPending}
        />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <Card>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Budget Period</div>
                <div className="text-sm">
                  {budget.startDate && budget.endDate
                    ? `${formatDate(budget.startDate)} to ${formatDate(budget.endDate)}`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Responsible</div>
                <div className="text-sm">{contactName(budget.responsibleContactId)}</div>
              </div>
              {revisionOf && (
                <div>
                  <div className="text-xs text-muted-foreground">Revision Of</div>
                  <button
                    type="button"
                    className="text-sm text-primary underline-offset-2 hover:underline"
                    onClick={() => navigate(`/budgets/${revisionOf.id}`)}
                  >
                    {revisionOf.name}
                  </button>
                </div>
              )}
              {revisedWith && (
                <div>
                  <div className="text-xs text-muted-foreground">Revised With</div>
                  <button
                    type="button"
                    className="text-sm text-primary underline-offset-2 hover:underline"
                    onClick={() => navigate(`/budgets/${revisedWith.id}`)}
                  >
                    {revisedWith.name}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Analytic</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Committed Amount</TableHead>
                    {showAchieved && <TableHead className="text-right">Achieved Amount</TableHead>}
                    {showAchieved && <TableHead className="text-right">Achieved %</TableHead>}
                    {showAchieved && <TableHead className="text-right">Amount To Achieve</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budget.lines.map((line) => {
                    const type = accountType(line.analyticAccountId)
                    const { total: achievedAmount, sources } = computeAchieved({
                      analyticAccountId: line.analyticAccountId,
                      accountType: type,
                      startDate: budget.startDate,
                      endDate: budget.endDate,
                      invoices,
                      bills,
                    })
                    const achievedPercent =
                      line.committedAmount > 0 ? (achievedAmount / line.committedAmount) * 100 : 0
                    const amountToAchieve = line.committedAmount - achievedAmount
                    return (
                      <TableRow key={line.id}>
                        <TableCell>{accountName(line.analyticAccountId)}</TableCell>
                        <TableCell className="capitalize">{type ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <CurrencyText amount={line.committedAmount} />
                        </TableCell>
                        {showAchieved && (
                          <TableCell className="text-right">
                            <button
                              type="button"
                              className="text-primary underline-offset-2 hover:underline"
                              onClick={() =>
                                setAchievedDialog({ name: accountName(line.analyticAccountId), sources })
                              }
                            >
                              <CurrencyText amount={achievedAmount} />
                            </button>
                          </TableCell>
                        )}
                        {showAchieved && <TableCell className="text-right">{achievedPercent.toFixed(0)}%</TableCell>}
                        {showAchieved && (
                          <TableCell className="text-right">
                            <CurrencyText amount={amountToAchieve} />
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {achievedDialog && (
        <AchievedSourcesDialog
          open
          onOpenChange={(open) => !open && setAchievedDialog(null)}
          analyticName={achievedDialog.name}
          sources={achievedDialog.sources}
        />
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

      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Cancel this budget?"
        description="This can't be undone."
        confirmLabel="Cancel Budget"
        destructive
        onConfirm={() => cancelBudget.mutate()}
      />
    </div>
  )
}

export function BudgetFormPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <BudgetDetail id={Number(id)} /> : <CreateBudget />
}
