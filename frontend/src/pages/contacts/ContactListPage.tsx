import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { ViewToggle, type DataViewMode } from '@/components/data-display/ViewToggle'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Search, MoreHorizontal, Pencil, Eye, Trash2, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '@/features/contacts/hooks'
import { ContactKanbanView } from '@/features/contacts/components/ContactKanbanView'
import { ContactForm } from '@/features/contacts/components/ContactForm'
import type { Contact } from '@/types/contact'
import type { ContactFormValues } from '@/features/contacts/schema'

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

function toContactInput(values: ContactFormValues) {
  return {
    ...values,
    mobile: values.mobile || null,
    city: values.city || null,
    state: values.state || null,
    pincode: values.pincode || null,
    profileImageUrl: values.profileImageUrl || null,
  }
}

function EditContactDialog({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const updateContact = useUpdateContact(contact.id)

  function handleSubmit(values: ContactFormValues) {
    updateContact.mutate(toContactInput(values), { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <ContactForm
          defaultValues={{
            name: contact.name,
            type: contact.type,
            email: contact.email,
            mobile: contact.mobile ?? '',
            city: contact.city ?? '',
            state: contact.state ?? '',
            pincode: contact.pincode ?? '',
            profileImageUrl: contact.profileImageUrl ?? '',
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateContact.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}

export function ContactListPage() {
  const { data: contacts, isLoading, isError } = useContacts()
  const createContact = useCreateContact()
  const deleteContact = useDeleteContact()
  const navigate = useNavigate()
  const [view, setView] = useState<DataViewMode>(readStoredView)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)

  function handleViewChange(next: DataViewMode) {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  function handleCreateSubmit(values: ContactFormValues) {
    createContact.mutate(toContactInput(values), {
      onSuccess: () => setIsCreateOpen(false),
    })
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
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {row.original.name.substring(0, 2).toUpperCase()}
          </div>
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.type === 'customer'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : row.original.type === 'vendor'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
          }
        >
          {TYPE_LABELS[row.original.type]}
        </Badge>
      ),
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => row.original.mobile ?? '—' },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) =>
        [row.original.city, row.original.state].filter(Boolean).join(', ') || '—',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/contacts/${row.original.id}`); }}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingContact(row.original); }}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); setDeletingContact(row.original); }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Customers and vendors"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Contact
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Contact</DialogTitle>
              </DialogHeader>
              <ContactForm onSubmit={handleCreateSubmit} isSubmitting={createContact.isPending} />
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load contacts." />}
      {contacts && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="pl-9"
              />
            </div>
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

      {editingContact && (
        <EditContactDialog contact={editingContact} onClose={() => setEditingContact(null)} />
      )}

      <ConfirmDialog
        open={deletingContact !== null}
        onOpenChange={(open) => !open && setDeletingContact(null)}
        title={`Delete ${deletingContact?.name}?`}
        description="This permanently removes the contact. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deletingContact) deleteContact.mutate(deletingContact.id)
        }}
      />
    </div>
  )
}
