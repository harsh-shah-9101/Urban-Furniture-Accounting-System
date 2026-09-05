import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  BookOpen,
  ShoppingCart,
  Receipt,
  Wallet,
  PiggyBank,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/useAuth'
import { canManageJournalDefinitions } from '@/features/auth/permissions'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export function Sidebar() {
  const { user } = useAuth()

  const groups: NavGroup[] = [
    { label: '', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      label: 'Master Data',
      items: [
        { to: '/contacts', label: 'Contacts', icon: Users },
        { to: '/products', label: 'Products', icon: Package },
      ],
    },
    {
      label: 'Accounting',
      items: [
        { to: '/accounting/chart-of-accounts', label: 'Chart of Accounts', icon: BookOpen },
        ...(user && canManageJournalDefinitions(user.role)
          ? [{ to: '/accounting/journals', label: 'Journals', icon: BookOpen }]
          : []),
        { to: '/accounting/journal-entries', label: 'Journal Entries', icon: BookOpen },
      ],
    },
    {
      label: 'Purchases',
      items: [
        { to: '/purchases/orders', label: 'Purchase Orders', icon: ShoppingCart },
        { to: '/purchases/bills', label: 'Vendor Bills', icon: Receipt },
      ],
    },
    {
      label: 'Sales',
      items: [
        { to: '/sales/orders', label: 'Sales Orders', icon: ShoppingCart },
        { to: '/sales/invoices', label: 'Customer Invoices', icon: Receipt },
      ],
    },
    { label: '', items: [{ to: '/payments', label: 'Payments', icon: Wallet }] },
    {
      label: 'Budgets',
      items: [
        { to: '/budgets/analytic-accounts', label: 'Analytic Accounts', icon: PiggyBank },
        { to: '/budgets', label: 'Budgets', icon: PiggyBank, end: true },
      ],
    },
    { label: '', items: [{ to: '/reports', label: 'Reports', icon: BarChart3 }] },
  ]

  return (
    <nav className="flex h-full w-56 flex-col gap-4 overflow-y-auto border-r border-border bg-background p-3">
      {groups.map((group, i) => (
        <div key={i} className="flex flex-col gap-1">
          {group.label && (
            <div className="px-2 pt-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {group.label}
            </div>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
