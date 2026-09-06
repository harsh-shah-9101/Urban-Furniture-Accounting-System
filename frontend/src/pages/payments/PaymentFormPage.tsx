import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, CheckCircle2, Undo2, XCircle, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { PaymentForm } from '@/features/payments/components/PaymentForm'
import {
  useCancelPayment,
  useConfirmPayment,
  useCreatePayment,
  usePayment,
  useResetPaymentToDraft,
  useUpdatePayment,
} from '@/features/payments/hooks'
import { useContacts } from '@/features/contacts/hooks'
import type { PaymentFormValues } from '@/features/payments/schema'

function CreatePayment() {
  const navigate = useNavigate()
  const createPayment = useCreatePayment()

  function handleSubmit(values: PaymentFormValues) {
    createPayment.mutate(
      { ...values, reference: values.reference || null, note: values.note || null },
      { onSuccess: (created) => navigate(`/payments/${created.id}`) },
    )
  }

  return (
    <div>
      <PageHeader title="New Payment" backTo="/payments" />
      <PaymentForm onSubmit={handleSubmit} isSubmitting={createPayment.isPending} />
    </div>
  )
}

function PaymentDetail({ id }: { id: number }) {
  const { data: payment, isLoading, isError } = usePayment(id)
  const { data: contacts } = useContacts()
  const updatePayment = useUpdatePayment(id)
  const confirmPayment = useConfirmPayment(id)
  const cancelPayment = useCancelPayment(id)
  const resetToDraft = useResetPaymentToDraft(id)
  const [isEditing, setIsEditing] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !payment) return <ErrorState message="Payment not found." />

  const partnerName = contacts?.find((c) => c.id === payment.partnerId)?.name ?? `Contact ${payment.partnerId}`

  function handleSubmit(values: PaymentFormValues) {
    updatePayment.mutate(
      { ...values, reference: values.reference || null, note: values.note || null },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="print:hidden">
        <PageHeader
          title={payment.paymentNumber ?? `Payment #${payment.id}`}
          description={`${payment.paymentType === 'send' ? 'To' : 'From'}: ${partnerName}`}
          backTo="/payments"
          actions={
            !isEditing && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                {payment.status === 'draft' && (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button onClick={() => confirmPayment.mutate()} disabled={confirmPayment.isPending}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {confirmPayment.isPending ? 'Confirming...' : 'Confirm'}
                    </Button>
                  </>
                )}
                {payment.status === 'confirmed' && (
                  <Button variant="outline" onClick={() => resetToDraft.mutate()} disabled={resetToDraft.isPending}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    Reset to Draft
                  </Button>
                )}
                {payment.status !== 'cancelled' && (
                  <Button variant="destructive" onClick={() => setIsCancelOpen(true)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            )
          }
        />
      </div>

      {isEditing ? (
        <PaymentForm
          defaultValues={{
            paymentType: payment.paymentType,
            partnerId: payment.partnerId ?? 0,
            method: payment.method,
            amount: payment.amount,
            paymentDate: payment.paymentDate,
            reference: payment.reference ?? '',
            note: payment.note ?? '',
            vendorBillId: payment.vendorBillId,
            customerInvoiceId: payment.customerInvoiceId,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updatePayment.isPending}
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={payment.status} />
              <CurrencyText amount={payment.amount} className="text-2xl font-semibold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Type</div>
                <div className="text-sm capitalize">{payment.paymentType}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Partner</div>
                <div className="text-sm">{partnerName}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="text-sm">{formatDate(payment.paymentDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Payment Via</div>
                <div className="text-sm capitalize">{payment.method}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reference</div>
                <div className="text-sm">{payment.reference ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Note</div>
                <div className="text-sm">{payment.note ?? '—'}</div>
              </div>
            </div>

            {(payment.vendorBillId || payment.customerInvoiceId) && (
              <div>
                <div className="text-xs text-muted-foreground">Against Document</div>
                <Link
                  to={
                    payment.vendorBillId
                      ? `/purchases/bills/${payment.vendorBillId}`
                      : `/sales/invoices/${payment.customerInvoiceId}`
                  }
                  className="text-sm text-primary hover:underline"
                >
                  {payment.vendorBillId ? `Vendor Bill #${payment.vendorBillId}` : `Customer Invoice #${payment.customerInvoiceId}`}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Cancel this payment?"
        description="This can't be undone."
        confirmLabel="Cancel Payment"
        destructive
        onConfirm={() => cancelPayment.mutate()}
      />
    </div>
  )
}

export function PaymentFormPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <PaymentDetail id={Number(id)} /> : <CreatePayment />
}
