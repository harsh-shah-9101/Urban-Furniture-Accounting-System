import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useContact } from '@/features/contacts/hooks'

const TYPE_LABELS = { customer: 'Customer', vendor: 'Vendor', both: 'Both' } as const

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: contact, isLoading, isError } = useContact(Number(id))

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !contact) return <ErrorState message="Contact not found." />

  const fields: [string, string][] = [
    ['Email', contact.email],
    ['Mobile', contact.mobile ?? '—'],
    [
      'Address',
      [contact.city, contact.state, contact.pincode].filter(Boolean).join(', ') || '—',
    ],
  ]

  return (
    <div>
      <PageHeader title={contact.name} />
      <Card className="max-w-lg">
        <CardContent className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            {TYPE_LABELS[contact.type]}
          </Badge>
          {fields.map(([label, value]) => (
            <div key={label}>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-sm">{value}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
