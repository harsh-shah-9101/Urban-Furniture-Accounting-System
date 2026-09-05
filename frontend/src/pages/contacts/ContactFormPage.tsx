import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContactForm } from '@/features/contacts/components/ContactForm'
import { useCreateContact } from '@/features/contacts/hooks'
import type { ContactFormValues } from '@/features/contacts/schema'

export function ContactFormPage() {
  const navigate = useNavigate()
  const createContact = useCreateContact()

  function handleSubmit(values: ContactFormValues) {
    const input = {
      ...values,
      mobile: values.mobile || null,
      city: values.city || null,
      state: values.state || null,
      pincode: values.pincode || null,
      profileImageUrl: values.profileImageUrl || null,
    }
    createContact.mutate(input, { onSuccess: (created) => navigate(`/contacts/${created.id}`) })
  }

  return (
    <div>
      <PageHeader title="New Contact" />
      <ContactForm onSubmit={handleSubmit} isSubmitting={createContact.isPending} />
    </div>
  )
}
