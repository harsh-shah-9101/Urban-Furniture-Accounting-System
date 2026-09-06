import { useMemo, useState } from 'react'
import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { cn } from '@/lib/utils'
import { getAvatarColor, initials } from '@/lib/avatar'
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
]

function InfoRow({ icon: Icon, value }: { icon: LucideIcon; value?: string | null }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
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
      className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:shadow-primary/5"
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {contact.profileImageUrl ? (
            <img
              src={contact.profileImageUrl}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover ring-1 ring-border/50"
            />
          ) : (
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-border/50", getAvatarColor(contact.name))}>
              {initials(contact.name) || '?'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium leading-none text-foreground">{contact.name}</h3>
            <p className="mt-1.5 truncate text-xs text-muted-foreground">
              {TYPE_LABELS[contact.type]} • <span className="font-mono text-muted-foreground/70">#{String(contact.id).padStart(4, '0')}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 text-xs text-muted-foreground">
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
    const result: Record<FilterValue, number> = { all: contacts.length, customer: 0, vendor: 0 }
    for (const contact of contacts) {
      if (contact.type === 'customer' || contact.type === 'vendor') result[contact.type]++
    }
    return result
  }, [contacts])

  const visibleContacts = filter === 'all' ? contacts : contacts.filter((c) => c.type === filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(({ value, label }) => {
          const isActive = filter === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-background border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {label}
              <span
                className={cn(
                  'ml-2.5 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  isActive 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted-foreground/10 text-muted-foreground'
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
