import type { ReactNode } from 'react'
import { BarChart3, Receipt, ShieldCheck } from 'lucide-react'

const highlights = [
  {
    icon: BarChart3,
    title: 'Live financial reports',
    description: 'Balance sheets, P&L, and budget reports that stay in sync with every entry.',
  },
  {
    icon: Receipt,
    title: 'Sales & purchase tracking',
    description: 'Invoices, payments, and vendor bills tracked end to end in one ledger.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Admins, accountants, and customers each see exactly what they need.',
  },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white p-3 text-black antialiased">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex min-h-[640px] items-center justify-center rounded-md border border-black/10 bg-white px-6 py-12 lg:min-h-0 lg:px-14 lg:py-20 xl:px-20">
          <div className="mx-auto w-full max-w-[440px]">{children}</div>
        </div>

        <div className="relative hidden overflow-hidden rounded-md bg-linear-to-br from-zinc-900 via-black to-zinc-900 p-12 text-white lg:flex lg:flex-col lg:justify-center lg:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative z-10 max-w-[420px]">
            <div className="text-sm font-medium tracking-wide text-white/50 uppercase">
              Urban Furniture Accounting
            </div>
            <h2 className="mt-4 text-3xl font-light leading-tight tracking-[-0.03em] text-white/90 sm:text-4xl">
              One ledger for your entire furniture business.
            </h2>

            <div className="mt-10 space-y-7">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5">
                    <Icon className="size-4.5 text-white/80" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{title}</div>
                    <div className="mt-0.5 text-sm text-white/55">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
