import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { accountSchema, type AccountFormValues } from '../schema'

const ACCOUNT_TYPE_LABELS: Record<AccountFormValues['type'], string> = {
  asset: 'Asset',
  liability: 'Liability',
  income: 'Income',
  expense: 'Expense',
  capital: 'Capital',
}

export function AccountForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: AccountFormValues) => void
  isSubmitting?: boolean
}) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { code: '', name: '', type: 'asset' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField control={form.control} name="code" label="Code">
          {(field) => <Input {...field} placeholder="e.g. 1000" />}
        </FormField>

        <FormField control={form.control} name="name" label="Name">
          {(field) => <Input {...field} placeholder="e.g. Cash" />}
        </FormField>

        <FormField control={form.control} name="type" label="Type">
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">
                  {(value: AccountFormValues['type']) => ACCOUNT_TYPE_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Account'}
        </Button>
      </form>
    </Form>
  )
}
