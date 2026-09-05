import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/features/accounts/hooks'
import { journalSchema, type JournalFormValues } from '../schema'

const JOURNAL_TYPE_LABELS: Record<JournalFormValues['type'], string> = {
  sales: 'Sales',
  purchase: 'Purchase',
  bank: 'Bank',
  cash: 'Cash',
  general: 'General',
}

const NONE = 'none'

export function JournalForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: JournalFormValues) => void
  isSubmitting?: boolean
}) {
  const { data: accounts } = useAccounts()

  const accountLabel = (value: string) => {
    if (value === NONE) return 'None'
    const account = accounts?.find((a) => a.id === Number(value))
    return account ? `${account.code} — ${account.name}` : value
  }

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      name: '',
      type: 'general',
      defaultDebitAccountId: null,
      defaultCreditAccountId: null,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-4">
        <FormField control={form.control} name="name" label="Name">
          {(field) => <Input {...field} placeholder="e.g. Sales Journal" />}
        </FormField>

        <FormField control={form.control} name="type" label="Type">
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">
                  {(value: JournalFormValues['type']) => JOURNAL_TYPE_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(JOURNAL_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="defaultDebitAccountId" label="Default Debit Account (optional)">
          {(field) => (
            <Select
              value={field.value === null ? NONE : String(field.value)}
              onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None">{accountLabel}</SelectValue>
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

        <FormField control={form.control} name="defaultCreditAccountId" label="Default Credit Account (optional)">
          {(field) => (
            <Select
              value={field.value === null ? NONE : String(field.value)}
              onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None">{accountLabel}</SelectValue>
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

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Journal'}
        </Button>
      </form>
    </Form>
  )
}
