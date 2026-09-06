import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { analyticAccountSchema, type AnalyticAccountFormValues } from '../schema'

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
      code: '',
      description: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-4">
        <FormField control={form.control} name="name" label="Analytic Account Name">
          {(field) => <Input {...field} placeholder="e.g. Marketing Department" />}
        </FormField>

        <FormField control={form.control} name="code" label="Code">
          {(field) => <Input {...field} placeholder="e.g. MKT-01" />}
        </FormField>

        <FormField control={form.control} name="description" label="Description (optional)">
          {(field) => <Input {...field} placeholder="e.g. Q1 marketing campaigns" />}
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Analytic Account'}
        </Button>
      </form>
    </Form>
  )
}
