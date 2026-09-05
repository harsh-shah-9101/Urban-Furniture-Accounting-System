import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { productSchema, type ProductFormValues } from '../schema'

const PRODUCT_TYPE_LABELS: Record<ProductFormValues['type'], string> = {
  goods: 'Goods',
  service: 'Service',
  combo: 'Combo',
}

export function ProductForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<ProductFormValues>
  onSubmit: (values: ProductFormValues) => void
  isSubmitting?: boolean
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      type: 'goods',
      salesPrice: 0,
      cost: 0,
      category: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-4">
        <FormField control={form.control} name="name" label="Product Name">
          {(field) => <Input {...field} placeholder="e.g. Wooden Chair" />}
        </FormField>

        <FormField control={form.control} name="type" label="Type">
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">
                  {(value: ProductFormValues['type']) => PRODUCT_TYPE_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="salesPrice" label="Sales Price">
            {(field) => (
              <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          </FormField>
          <FormField control={form.control} name="cost" label="Cost (Purchase Price)">
            {(field) => (
              <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
            )}
          </FormField>
        </div>

        <FormField control={form.control} name="category" label="Category">
          {(field) => <Input {...field} placeholder="e.g. Seating" />}
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Product'}
        </Button>
      </form>
    </Form>
  )
}
