import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Topbar } from './Topbar'

const links = [
  { to: '/portal/invoices', label: 'My Invoices & Bills' },
  { to: '/portal/payments', label: 'Payment History' },
]

export function PortalShell() {
  return (
    <div className="flex h-screen flex-col">
      <Topbar />
      <div className="flex items-center gap-1 border-b border-border bg-background px-4 py-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
