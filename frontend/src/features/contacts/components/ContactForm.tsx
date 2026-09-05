import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { contactSchema, type ContactFormValues } from '../schema'

const CONTACT_TYPE_LABELS: Record<ContactFormValues['type'], string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  both: 'Both',
}

export function ContactForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<ContactFormValues>
  onSubmit: (values: ContactFormValues) => void
  isSubmitting?: boolean
}) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      type: 'customer',
      email: '',
      mobile: '',
      city: '',
      state: '',
      pincode: '',
      profileImageUrl: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-4">
        <FormField control={form.control} name="name" label="Name">
          {(field) => <Input {...field} placeholder="e.g. Azure Furniture" />}
        </FormField>

        <FormField control={form.control} name="type" label="Type">
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">
                  {(value: ContactFormValues['type']) => CONTACT_TYPE_LABELS[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="email" label="Email">
          {(field) => <Input {...field} type="email" placeholder="name@example.com" />}
        </FormField>

        <FormField control={form.control} name="mobile" label="Mobile (optional)">
          {(field) => <Input {...field} placeholder="9876500000" />}
        </FormField>

        <div className="grid grid-cols-3 gap-3">
          <FormField control={form.control} name="city" label="City">
            {(field) => <Input {...field} placeholder="City" />}
          </FormField>
          <FormField control={form.control} name="state" label="State">
            {(field) => <Input {...field} placeholder="State" />}
          </FormField>
          <FormField control={form.control} name="pincode" label="Pincode">
            {(field) => <Input {...field} placeholder="Pincode" />}
          </FormField>
        </div>

        <FormField control={form.control} name="profileImageUrl" label="Profile Image URL (optional)">
          {(field) => <Input {...field} placeholder="https://..." />}
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-fit">
          {isSubmitting ? 'Saving...' : 'Save Contact'}
        </Button>
      </form>
    </Form>
  )
}
