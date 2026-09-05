import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useContacts } from '@/features/contacts/hooks'
import type { Contact } from '@/types/contact'

const TYPE_LABELS: Record<Contact['type'], string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  both: 'Both',
}

export function ContactListPage() {
  const { data: contacts, isLoading, isError } = useContacts()
  const navigate = useNavigate()

  const columns: ColumnDef<Contact, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>,
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => row.original.mobile ?? '—' },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) =>
        [row.original.city, row.original.state].filter(Boolean).join(', ') || '—',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Customers and vendors"
        actions={<Button onClick={() => navigate('/contacts/new')}>New Contact</Button>}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load contacts." />}
      {contacts && (
        <DataTable
          columns={columns}
          data={contacts}
          searchPlaceholder="Search contacts..."
          onRowClick={(contact) => navigate(`/contacts/${contact.id}`)}
          emptyTitle="No contacts yet"
          emptyDescription="Add your first customer or vendor to get started."
        />
      )}
    </div>
  )
}
