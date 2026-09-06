import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useContacts } from '@/features/contacts/hooks'
import { useVendorBills } from '@/features/purchases/hooks'
import { useCustomerInvoices } from '@/features/sales/hooks'
import { paymentSchema, type PaymentFormValues } from '../schema'

const NONE = 'none'

const PAYMENT_TYPE_LABELS: Record<PaymentFormValues['paymentType'], string> = {
  send: 'Send (pay a vendor)',
  receive: 'Receive (from a customer)',
}

export function PaymentForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<PaymentFormValues>
  onSubmit: (values: PaymentFormValues) => void
  isSubmitting?: boolean
}) {
  const { data: contacts } = useContacts()
  const { data: vendorBills } = useVendorBills()
  const { data: customerInvoices } = useCustomerInvoices()

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentType: 'send',
      partnerId: 0,
      method: 'bank',
      amount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: '',
      note: '',
      vendorBillId: null,
      customerInvoiceId: null,
      ...defaultValues,
    },
  })

  const paymentType = form.watch('paymentType')
  const partnerId = form.watch('partnerId')

  const partners =
    contacts?.filter((c) => (paymentType === 'send' ? c.type !== 'customer' : c.type !== 'vendor')) ?? []

  const openBills =
    vendorBills?.filter(
      (bill) => bill.vendorId === partnerId && (bill.status === 'posted' || bill.status === 'partially_paid'),
    ) ?? []
  const openInvoices =
    customerInvoices?.filter(
      (invoice) => invoice.customerId === partnerId && (invoice.status === 'posted' || invoice.status === 'partially_paid'),
    ) ?? []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField control={form.control} name="paymentType" label="Payment Type">
          {(field) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                if (!value) return
                field.onChange(value)
                form.setValue('partnerId', 0)
                form.setValue('vendorBillId', null)
                form.setValue('customerInvoiceId', null)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">
                  {(value: PaymentFormValues['paymentType']) => PAYMENT_TYPE_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="partnerId" label={paymentType === 'send' ? 'Vendor' : 'Customer'}>
          {(field) => (
            <Select
              value={field.value ? String(field.value) : ''}
              onValueChange={(value) => {
                field.onChange(Number(value))
                form.setValue('vendorBillId', null)
                form.setValue('customerInvoiceId', null)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select partner">
                  {(value: string) => partners.find((p) => String(p.id) === value)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={String(partner.id)}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        {paymentType === 'send' && openBills.length > 0 && (
          <FormField control={form.control} name="vendorBillId" label="Against Vendor Bill (optional)">
            {(field) => (
              <Select
                value={field.value ? String(field.value) : NONE}
                onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None">
                    {(value: string) =>
                      value === NONE
                        ? 'None'
                        : (openBills.find((b) => String(b.id) === value)?.billNumber ?? `Bill ${value}`)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {openBills.map((bill) => (
                    <SelectItem key={bill.id} value={String(bill.id)}>
                      {bill.billNumber ?? `BILL-${bill.id.toString().padStart(5, '0')}`} — due {bill.amountDue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        )}

        {paymentType === 'receive' && openInvoices.length > 0 && (
          <FormField control={form.control} name="customerInvoiceId" label="Against Customer Invoice (optional)">
            {(field) => (
              <Select
                value={field.value ? String(field.value) : NONE}
                onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None">
                    {(value: string) =>
                      value === NONE
                        ? 'None'
                        : (openInvoices.find((i) => String(i.id) === value)?.invoiceNumber ?? `Invoice ${value}`)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {openInvoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={String(invoice.id)}>
                      {invoice.invoiceNumber ?? `INV-${invoice.id.toString().padStart(5, '0')}`} — due{' '}
                      {invoice.amountDue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="method" label="Payment Via">
            {(field) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(value: 'cash' | 'bank') => (value === 'cash' ? 'Cash' : 'Bank')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField control={form.control} name="paymentDate" label="Date">
            {(field) => <Input type="date" {...field} />}
          </FormField>
        </div>

        <FormField control={form.control} name="amount" label="Amount">
          {(field) => (
            <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
          )}
        </FormField>

        <FormField control={form.control} name="reference" label="Reference (optional)">
          {(field) => <Input {...field} placeholder="Cheque / UTR no." />}
        </FormField>

        <FormField control={form.control} name="note" label="Note (optional)">
          {(field) => <Input {...field} placeholder="Note" />}
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Payment'}
        </Button>
      </form>
    </Form>
  )
}
