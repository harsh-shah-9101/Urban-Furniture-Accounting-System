import { useMemo, useState } from 'react'
import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { cn } from '@/lib/utils'
import type { Contact, ContactType } from '@/types/contact'

type FilterValue = 'all' | ContactType

const TYPE_LABELS: Record<ContactType, string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  both: 'Customer & Vendor',
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'customer', label: 'Customers' },
  { value: 'vendor', label: 'Vendors' },
  { value: 'both', label: 'Both' },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0]]
  return letters.filter(Boolean).join('').toUpperCase()
}

function InfoRow({ icon: Icon, value }: { icon: LucideIcon; value?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{value || '—'}</span>
    </div>
  )
}

function ContactCard({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  const location = [contact.city, contact.state].filter(Boolean).join(', ')

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-muted/30"
    >
      <div className="flex items-center gap-3">
        {contact.profileImageUrl ? (
          <img
            src={contact.profileImageUrl}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {initials(contact.name) || '?'}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{TYPE_LABELS[contact.type]}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3 text-sm text-foreground">
        <InfoRow icon={Mail} value={contact.email} />
        <InfoRow icon={Phone} value={contact.mobile} />
        <InfoRow icon={MapPin} value={location} />
      </div>
    </button>
  )
}

export function ContactKanbanView({
  contacts,
  onSelect,
}: {
  contacts: Contact[]
  onSelect: (contact: Contact) => void
}) {
  const [filter, setFilter] = useState<FilterValue>('all')

  const counts = useMemo(() => {
    const result: Record<FilterValue, number> = { all: contacts.length, customer: 0, vendor: 0, both: 0 }
    for (const contact of contacts) result[contact.type]++
    return result
  }, [contacts])

  const visibleContacts = filter === 'all' ? contacts : contacts.filter((c) => c.type === filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
        {FILTERS.map(({ value, label }) => {
          const isActive = filter === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs leading-none',
                  isActive ? 'bg-muted text-muted-foreground' : 'bg-muted/70 text-muted-foreground'
                )}
              >
                {counts[value]}
              </span>
            </button>
          )
        })}
      </div>

      {visibleContacts.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description="Try a different filter or search, or add your first customer or vendor."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} onClick={() => onSelect(contact)} />
          ))}
        </div>
      )}
    </div>
  )
}
