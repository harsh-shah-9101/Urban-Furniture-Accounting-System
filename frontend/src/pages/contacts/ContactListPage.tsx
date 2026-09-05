import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { ViewToggle, type DataViewMode } from '@/components/data-display/ViewToggle'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useContacts } from '@/features/contacts/hooks'
import { ContactKanbanView } from '@/features/contacts/components/ContactKanbanView'
import type { Contact } from '@/types/contact'

const TYPE_LABELS: Record<Contact['type'], string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  both: 'Both',
}

const VIEW_STORAGE_KEY = 'contacts:view-mode'

function readStoredView(): DataViewMode {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY)
  return stored === 'kanban' ? 'kanban' : 'list'
}

export function ContactListPage() {
  const { data: contacts, isLoading, isError } = useContacts()
  const navigate = useNavigate()
  const [view, setView] = useState<DataViewMode>(readStoredView)
  const [search, setSearch] = useState('')

  function handleViewChange(next: DataViewMode) {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    const query = search.trim().toLowerCase()
    if (!query) return contacts
    return contacts.filter((contact) =>
      [contact.name, contact.email, contact.mobile, contact.city, contact.state]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    )
  }, [contacts, search])

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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="max-w-xs"
            />
            <ViewToggle value={view} onChange={handleViewChange} />
          </div>

          {view === 'list' ? (
            <DataTable
              columns={columns}
              data={contacts}
              onRowClick={(contact) => navigate(`/contacts/${contact.id}`)}
              emptyTitle="No contacts yet"
              emptyDescription="Add your first customer or vendor to get started."
              searchValue={search}
              onSearchChange={setSearch}
              hideSearchInput
            />
          ) : (
            <ContactKanbanView
              contacts={filteredContacts}
              onSelect={(contact) => navigate(`/contacts/${contact.id}`)}
            />
          )}
        </div>
      )}
    </div>
  )
}
