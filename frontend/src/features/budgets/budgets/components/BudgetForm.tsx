import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useAnalyticAccounts } from '@/features/budgets/analytic-accounts/hooks'
import { useContacts } from '@/features/contacts/hooks'
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
  const { data: contacts } = useContacts()

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      responsibleContactId: 0,
      lines: [{ analyticAccountId: 0, committedAmount: 0 }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' })

  const accountType = (accountId: number) =>
    analyticAccounts?.find((account) => account.id === accountId)?.type

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid max-w-2xl grid-cols-2 gap-3">
          <FormField control={form.control} name="name" label="Budget Name">
            {(field) => <Input {...field} placeholder="e.g. January 2026" />}
          </FormField>
          <FormField control={form.control} name="responsibleContactId" label="Responsible">
            {(field) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select contact">
                    {(value: string) => contacts?.find((contact) => contact.id === Number(value))?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={String(contact.id)}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>

        <div className="grid max-w-2xl grid-cols-2 gap-3">
          <FormField control={form.control} name="startDate" label="Start Date">
            {(field) => <Input type="date" {...field} />}
          </FormField>
          <FormField control={form.control} name="endDate" label="End Date">
            {(field) => <Input type="date" {...field} />}
          </FormField>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Analytic Accounts</div>
          {fields.map((line, index) => {
            const selectedAccountId = form.watch(`lines.${index}.analyticAccountId`)
            const type = accountType(selectedAccountId)
            return (
              <div key={line.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="grid grid-cols-[1fr_90px_1fr_auto] items-end gap-2">
                  <FormField control={form.control} name={`lines.${index}.analyticAccountId`} label="Analytic">
                    {(field) => (
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select account">
                            {(value: string) =>
                              analyticAccounts?.find((account) => account.id === Number(value))?.name
                            }
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

                  <div>
                    <div className="mb-2 text-sm font-medium">Type</div>
                    <div className="flex h-9 items-center text-sm capitalize text-muted-foreground">
                      {type ?? '—'}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name={`lines.${index}.committedAmount`}
                    label="Committed Amount"
                  >
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
              </div>
            )
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => append({ analyticAccountId: 0, committedAmount: 0 })}
          >
            <Plus className="size-4" /> Add Analytic Account
          </Button>
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Budget'}
        </Button>
      </form>
    </Form>
  )
}
