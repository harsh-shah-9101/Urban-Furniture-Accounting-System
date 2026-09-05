import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { DocumentView } from '@/components/data-display/DocumentView'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Printer, CreditCard, Send, CheckCircle2, Receipt } from 'lucide-react'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'
import { usePayVendorBill, usePostVendorBill, useVendorBill } from '@/features/purchases/hooks'
import { billPaymentSchema, type BillPaymentFormValues } from '@/features/purchases/schema'

function RegisterPaymentForm({ billId }: { billId: number }) {
  const payBill = usePayVendorBill(billId)
  const form = useForm<BillPaymentFormValues>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: { method: 'bank', amount: undefined, reference: '' },
  })

  function handleSubmit(values: BillPaymentFormValues) {
    payBill.mutate({
      method: values.method,
      amount: values.amount ?? null,
      reference: values.reference || null,
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

        <Button type="submit" disabled={payBill.isPending}>
          {payBill.isPending ? 'Registering...' : 'Register Payment'}
        </Button>
      </form>
    </Form>
  )
}

export function VendorBillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const billId = Number(id)
  const { data: bill, isLoading, isError } = useVendorBill(billId)
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const postBill = usePostVendorBill(billId)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !bill) return <ErrorState message="Vendor bill not found." />

  const vendorName = contacts?.find((c) => c.id === bill.vendorId)?.name ?? `Vendor ${bill.vendorId}`
  const productName = (productId: number) => products?.find((p) => p.id === productId)?.name ?? `Product ${productId}`

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="print:hidden">
        <PageHeader
          title={`Vendor Bill #${bill.id}`}
          description={`Vendor: ${vendorName}`}
          backTo="/purchases/bills"
          actions={
            <div className="flex items-center gap-2">
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
            </p>
          }
          status={<StatusBadge status={bill.status} />}
          documentNoLabel="Bill No."
          documentNo={`BILL-${bill.id.toString().padStart(5, '0')}`}
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
        />

        {bill.status === 'posted' && (
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
    </div>
  )
}
