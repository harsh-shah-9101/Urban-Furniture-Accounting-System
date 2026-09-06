import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import { budgetSchema, type BudgetFormValues } from '../schema'

export function BudgetForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<BudgetFormValues>
  onSubmit: (values: BudgetFormValues) => void
  isSubmitting?: boolean
}) {
  const { data: analyticAccounts } = useAnalyticAccounts()

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      analyticAccountId: 0,
      budgetAmount: 0,
      startDate: '',
      endDate: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-4">
        <FormField control={form.control} name="name" label="Budget Name">
          {(field) => <Input {...field} placeholder="e.g. Q1 Marketing Budget" />}
        </FormField>

        <FormField control={form.control} name="analyticAccountId" label="Analytic Account">
          {(field) => (
            <Select
              value={field.value ? String(field.value) : ''}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select analytic account">
                  {(value: string) => analyticAccounts?.find((account) => account.id === Number(value))?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {analyticAccounts?.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.code} — {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="startDate" label="Start Date">
            {(field) => <Input type="date" {...field} />}
          </FormField>
          <FormField control={form.control} name="endDate" label="End Date">
            {(field) => <Input type="date" {...field} />}
          </FormField>
        </div>

        <FormField control={form.control} name="budgetAmount" label="Budget Amount">
          {(field) => (
            <CurrencyInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
          )}
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Budget'}
        </Button>
      </form>
    </Form>
  )
}
