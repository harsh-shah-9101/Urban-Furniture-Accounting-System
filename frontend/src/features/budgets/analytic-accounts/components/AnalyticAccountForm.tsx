import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { analyticAccountSchema, type AnalyticAccountFormValues } from '../schema'

const TYPE_LABELS: Record<AnalyticAccountFormValues['type'], string> = {
  income: 'Income',
  expense: 'Expenses',
}

export function AnalyticAccountForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<AnalyticAccountFormValues>
  onSubmit: (values: AnalyticAccountFormValues) => void
  isSubmitting?: boolean
}) {
  const form = useForm<AnalyticAccountFormValues>({
    resolver: zodResolver(analyticAccountSchema),
    defaultValues: {
      name: '',
      type: 'expense',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-4">
        <FormField control={form.control} name="name" label="Analytic Account Name">
          {(field) => <Input {...field} placeholder="e.g. Marketing Department" />}
        </FormField>

        <FormField control={form.control} name="type" label="Type">
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">
                  {(value: AnalyticAccountFormValues['type']) => TYPE_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Analytic Account'}
        </Button>
      </form>
    </Form>
  )
}
