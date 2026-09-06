import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DocumentView } from '@/components/data-display/DocumentView'
import { Printer, CreditCard, Send, CheckCircle2, Receipt, XCircle, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'
import {
  useCancelVendorBill,
  usePayVendorBill,
  usePostVendorBill,
  useUpdateVendorBillDates,
  useVendorBill,
} from '@/features/purchases/hooks'
import {
  billPaymentSchema,
  vendorBillDatesSchema,
  type BillPaymentFormValues,
  type VendorBillDatesFormValues,
} from '@/features/purchases/schema'
import type { VendorBill } from '@/types/purchases'

function RegisterPaymentForm({ billId }: { billId: number }) {
  const payBill = usePayVendorBill(billId)
  const form = useForm<BillPaymentFormValues>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: { method: 'bank', amount: undefined, reference: '', note: '' },
  })

  function handleSubmit(values: BillPaymentFormValues) {
    payBill.mutate({
      method: values.method,
      amount: values.amount ?? null,
      reference: values.reference || null,
      note: values.note || null,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-wrap items-end gap-3">
        <FormField control={form.control} name="method" label="Method">
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-32">
                <SelectValue>{(value: 'cash' | 'bank') => (value === 'cash' ? 'Cash' : 'Bank')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="amount" label="Amount (optional = full)">
          {(field) => (
            <CurrencyInput
              value={field.value ?? NaN}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        </FormField>

        <FormField control={form.control} name="reference" label="Reference (optional)">
          {(field) => <Input {...field} placeholder="Cheque / UTR no." />}
        </FormField>

        <FormField control={form.control} name="note" label="Note (optional)">
          {(field) => <Input {...field} placeholder="Note" />}
        </FormField>

        <Button type="submit" disabled={payBill.isPending}>
          {payBill.isPending ? 'Registering...' : 'Register Payment'}
        </Button>
      </form>
    </Form>
  )
}

function EditBillDetailsDialog({ bill, onClose }: { bill: VendorBill; onClose: () => void }) {
  const updateDates = useUpdateVendorBillDates(bill.id)
  const form = useForm<VendorBillDatesFormValues>({
    resolver: zodResolver(vendorBillDatesSchema),
    defaultValues: {
      billReference: bill.billReference ?? '',
      billDate: bill.billDate,
      dueDate: bill.dueDate ?? '',
    },
  })

  function handleSubmit(values: VendorBillDatesFormValues) {
    updateDates.mutate(
      {
        billReference: values.billReference || null,
        billDate: values.billDate,
        dueDate: values.dueDate || null,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Bill Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="billReference" label="Bill Reference (optional)">
              {(field) => <Input {...field} placeholder="e.g. ABC-26-001" />}
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="billDate" label="Bill Date">
                {(field) => <Input type="date" {...field} />}
              </FormField>
              <FormField control={form.control} name="dueDate" label="Due Date (optional)">
                {(field) => <Input type="date" {...field} />}
              </FormField>
            </div>
            <Button type="submit" disabled={updateDates.isPending} className="mt-2 w-fit">
              {updateDates.isPending ? 'Saving...' : 'Save Details'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function PaymentHistoryCard({ bill }: { bill: VendorBill }) {
  if (bill.payments.length === 0) return null

  return (
    <Card className="border-border/50 shadow-sm print:hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bill.payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                <TableCell className="capitalize">{payment.method}</TableCell>
                <TableCell>{payment.reference ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <CurrencyText amount={payment.amount} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function VendorBillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const billId = Number(id)
  const { data: bill, isLoading, isError } = useVendorBill(billId)
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const postBill = usePostVendorBill(billId)
  const cancelBill = useCancelVendorBill(billId)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !bill) return <ErrorState message="Vendor bill not found." />

  const vendorName = contacts?.find((c) => c.id === bill.vendorId)?.name ?? `Vendor ${bill.vendorId}`
  const productName = (productId: number) => products?.find((p) => p.id === productId)?.name ?? `Product ${productId}`
  const canCancel = bill.status === 'draft' || bill.status === 'posted' || bill.status === 'partially_paid'
  const canPay = bill.status === 'posted' || bill.status === 'partially_paid'

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="print:hidden">
        <PageHeader
          title={`Vendor Bill #${bill.id}`}
          description={`Vendor: ${vendorName}`}
          backTo="/purchases/bills"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditingDetails(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              {bill.status === 'draft' && (
                <Button onClick={() => postBill.mutate()} disabled={postBill.isPending} className="bg-primary hover:bg-primary/90">
                  <Send className="mr-2 h-4 w-4" />
                  {postBill.isPending ? 'Posting...' : 'Post Bill'}
                </Button>
              )}
              {canCancel && (
                <Button variant="destructive" onClick={() => setIsCancelOpen(true)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="mt-6 flex flex-col gap-6 print:mt-0">
        <DocumentView
          title="VENDOR BILL"
          icon={Receipt}
          reference={
            <p className="flex items-center gap-2">
              Reference:{' '}
              <Link to={`/purchases/orders/${bill.purchaseOrderId}`} className="text-primary hover:underline font-medium">
                PO-{bill.purchaseOrderId}
              </Link>
              {bill.billReference && <span className="text-muted-foreground">· {bill.billReference}</span>}
            </p>
          }
          status={<StatusBadge status={bill.status} />}
          documentNoLabel="Bill No."
          documentNo={bill.billNumber ?? `BILL-${bill.id.toString().padStart(5, '0')}`}
          meta={[
            { label: 'Bill Date', value: formatDate(bill.billDate) },
            ...(bill.dueDate ? [{ label: 'Due Date', value: formatDate(bill.dueDate) }] : []),
          ]}
          leftParty={{
            label: 'Company',
            name: 'Urban Furniture Inc.',
            details: (
              <>
                123 Design Avenue
                <br />
                Craftsville, CA 90210
              </>
            ),
          }}
          rightParty={{
            label: 'Billed From',
            name: vendorName,
            details: <>Vendor ID: {bill.vendorId}</>,
          }}
          lines={bill.lines.map((line) => ({
            id: line.id,
            description: productName(line.productId),
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          }))}
          totalAmount={bill.totalAmount}
          extraTotals={[
            { label: 'Paid via Cash', amount: bill.paidByCash },
            { label: 'Paid via Bank', amount: bill.paidByBank },
            {
              label: 'Amount Due',
              amount: bill.amountDue,
              className: bill.amountDue > 0 ? 'font-semibold text-destructive' : 'font-semibold',
            },
          ]}
        />

        <PaymentHistoryCard bill={bill} />

        {canPay && (
          <Card className="border-border/50 shadow-sm print:hidden border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Register Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RegisterPaymentForm billId={bill.id} />
            </CardContent>
          </Card>
        )}

        {bill.status === 'paid' && (
           <Card className="border-green-500/20 bg-green-500/5 shadow-sm print:hidden">
            <CardContent className="flex items-center justify-center gap-3 py-6 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-lg font-medium">This bill has been fully paid.</span>
            </CardContent>
          </Card>
        )}
      </div>

      {isEditingDetails && (
        <EditBillDetailsDialog bill={bill} onClose={() => setIsEditingDetails(false)} />
      )}

      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Cancel this vendor bill?"
        description="This can't be undone."
        confirmLabel="Cancel Bill"
        destructive
        onConfirm={() => cancelBill.mutate()}
      />
    </div>
  )
}
