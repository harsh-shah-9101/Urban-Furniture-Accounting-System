import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'
import { useAccounts } from '@/features/accounts/hooks'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import { salesOrderSchema, type SalesOrderFormValues } from '../schema'

const NONE = 'none'

function OrderTotal({ control }: { control: ReturnType<typeof useForm<SalesOrderFormValues>>['control'] }) {
  const lines = useWatch({ control, name: 'lines' })
  const total = lines.reduce((sum, line) => sum + (line.quantity || 0) * (line.unitPrice || 0), 0)
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5 text-sm font-medium">
      <span>Total</span>
      <CurrencyText amount={total} className="text-base" />
    </div>
  )
}

export function SalesOrderForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: SalesOrderFormValues) => void
  isSubmitting?: boolean
}) {
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const { data: accounts } = useAccounts()
  const { data: allAnalyticAccounts } = useAnalyticAccounts()
  const analyticAccounts = allAnalyticAccounts?.filter((account) => account.type === 'income')
  const customers = contacts?.filter((c) => c.type === 'customer' || c.type === 'both') ?? []

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      customerId: 0,
      orderDate: new Date().toISOString().slice(0, 10),
      notes: '',
      lines: [{ productId: 0, quantity: 1, unitPrice: 0, analyticAccountId: null, accountId: null }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="customerId" label="Customer">
            {(field) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField control={form.control} name="orderDate" label="Order Date">
            {(field) => <Input type="date" {...field} />}
          </FormField>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Lines</div>
          {fields.map((line, index) => (
            <div key={line.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="grid grid-cols-[1fr_90px_130px_auto] items-end gap-2">
                <FormField control={form.control} name={`lines.${index}.productId`} label="Product">
                  {(field) => (
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={String(product.id)}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>

                <FormField control={form.control} name={`lines.${index}.quantity`} label="Qty">
                  {(field) => (
                    <Input
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      onBlur={field.onBlur}
                    />
                  )}
                </FormField>

                <FormField control={form.control} name={`lines.${index}.unitPrice`} label="Unit Price">
                  {(field) => (
                    <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                  )}
                </FormField>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label="Remove line"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name={`lines.${index}.accountId`} label="Chart of Account (optional)">
                  {(field) => (
                    <Select
                      value={field.value ? String(field.value) : NONE}
                      onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={String(account.id)}>
                            {account.code} — {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>

                <FormField
                  control={form.control}
                  name={`lines.${index}.analyticAccountId`}
                  label="Budget Analytics (optional)"
                >
                  {(field) => (
                    <Select
                      value={field.value ? String(field.value) : NONE}
                      onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {analyticAccounts?.map((account) => (
                          <SelectItem key={account.id} value={String(account.id)}>
                            {account.code} — {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0, analyticAccountId: null, accountId: null })}
          >
            <Plus className="size-4" /> Add Line
          </Button>
        </div>

        <OrderTotal control={form.control} />

        <FormField control={form.control} name="notes" label="Notes (optional)">
          {(field) => <Textarea {...field} placeholder="Internal notes for this order" />}
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Create Sales Order'}
        </Button>
      </form>
    </Form>
  )
}
