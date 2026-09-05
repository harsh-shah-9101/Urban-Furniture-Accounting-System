import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'
import { salesOrderSchema, type SalesOrderFormValues } from '../schema'

export function SalesOrderForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: SalesOrderFormValues) => void
  isSubmitting?: boolean
}) {
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const customers = contacts?.filter((c) => c.type === 'customer' || c.type === 'both') ?? []

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      customerId: 0,
      notes: '',
      lines: [{ productId: 0, quantity: 1, unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField control={form.control} name="customerId" label="Customer">
          {(field) => (
            <Select
              value={field.value ? String(field.value) : ''}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer">
                  {(value: string) => customers.find((c) => String(c.id) === value)?.name}
                </SelectValue>
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

        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Lines</div>
          {fields.map((line, index) => (
            <div key={line.id} className="grid grid-cols-[1fr_100px_140px_auto] items-end gap-2">
              <FormField control={form.control} name={`lines.${index}.productId`} label="Product">
                {(field) => (
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select product">
                        {(value: string) => products?.find((p) => String(p.id) === value)?.name}
                      </SelectValue>
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
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0 })}
          >
            <Plus className="size-4" /> Add Line
          </Button>
        </div>

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
