import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Package,
  BookOpen,
  NotebookText,
  ShoppingBag,
  ShoppingCart,
  PiggyBank,
  Plus,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/useAuth'
import { useDashboard } from '@/features/dashboard/hooks'
import { useSalesOrders } from '@/features/sales/hooks'
import { usePurchaseOrders } from '@/features/purchases/hooks'
import { useBudgets } from '@/features/budgets/budgets/hooks'
import { useJournalEntries } from '@/features/journal-entries/hooks'
import { useJournals } from '@/features/journals/hooks'

const ACCENTS = {
  slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  amber: 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
} as const

type Accent = keyof typeof ACCENTS

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: LucideIcon
  accent: Accent
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', ACCENTS[accent])}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function ModuleCardHeader({
  title,
  icon: Icon,
  accent,
  action,
}: {
  title: string
  icon: LucideIcon
  accent: Accent
  action: ReactNode
}) {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <div className="flex items-center gap-2.5">
        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', ACCENTS[accent])}>
          <Icon className="size-4" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
      {action}
    </CardHeader>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useDashboard()
  const { data: salesOrders } = useSalesOrders()
  const { data: purchaseOrders } = usePurchaseOrders()
  const { data: budgets } = useBudgets()
  const { data: journalEntries } = useJournalEntries()
  const { data: journals } = useJournals()
  const navigate = useNavigate()

  const journalName = (id: number) => journals?.find((j) => j.id === id)?.name ?? `Journal ${id}`

  const cards = data
    ? [
        { label: 'Contacts', value: data.contacts, icon: Users, accent: 'slate' as const },
        { label: 'Products', value: data.products, icon: Package, accent: 'indigo' as const },
        { label: 'Accounts', value: data.accounts, icon: BookOpen, accent: 'amber' as const },
        { label: 'Journals', value: data.journals, icon: NotebookText, accent: 'emerald' as const },
      ]
    : []

  const salesStats = {
    all: salesOrders?.length ?? 0,
    confirmed: salesOrders?.filter((o) => o.status === 'confirmed').length ?? 0,
    draft: salesOrders?.filter((o) => o.status === 'draft').length ?? 0,
  }

  const purchaseStats = {
    all: purchaseOrders?.length ?? 0,
    confirmed: purchaseOrders?.filter((o) => o.status === 'confirmed').length ?? 0,
    draft: purchaseOrders?.filter((o) => o.status === 'draft').length ?? 0,
  }

  const budgetStats = {
    total: budgets?.length ?? 0,
    active: budgets?.filter((b) => !b.archived).length ?? 0,
    archived: budgets?.filter((b) => b.archived).length ?? 0,
  }

  const recentEntries = journalEntries ? [...journalEntries].slice(-5).reverse() : []

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.name ?? ''}`} description="Urban Furniture Accounting overview" />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load dashboard." />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                accent={card.accent}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <ModuleCardHeader
                title="Sales"
                icon={ShoppingBag}
                accent="slate"
                action={
                  <Button size="sm" onClick={() => navigate('/sales/orders/new')}>
                    <Plus className="size-4" />
                    New
                  </Button>
                }
              />
              <CardContent className="grid grid-cols-3 gap-2">
                <StatTile label="All" value={salesStats.all} />
                <StatTile label="Confirmed" value={salesStats.confirmed} />
                <StatTile label="Draft" value={salesStats.draft} />
              </CardContent>
            </Card>

            <Card>
              <ModuleCardHeader
                title="Purchase"
                icon={ShoppingCart}
                accent="indigo"
                action={
                  <Button size="sm" onClick={() => navigate('/purchases/orders/new')}>
                    <Plus className="size-4" />
                    New
                  </Button>
                }
              />
              <CardContent className="grid grid-cols-3 gap-2">
                <StatTile label="All" value={purchaseStats.all} />
                <StatTile label="Confirmed" value={purchaseStats.confirmed} />
                <StatTile label="Draft" value={purchaseStats.draft} />
              </CardContent>
            </Card>

            <Card>
              <ModuleCardHeader
                title="Budgets"
                icon={PiggyBank}
                accent="amber"
                action={
                  <Button size="sm" onClick={() => navigate('/reports/budget')}>
                    <FileBarChart className="size-4" />
                    Report
                  </Button>
                }
              />
              <CardContent className="grid grid-cols-3 gap-2">
                <StatTile label="Total" value={budgetStats.total} />
                <StatTile label="Active" value={budgetStats.active} />
                <StatTile label="Archived" value={budgetStats.archived} />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <ModuleCardHeader
              title="Recent Journal Entries"
              icon={NotebookText}
              accent="emerald"
              action={
                <Button size="sm" variant="outline" onClick={() => navigate('/accounting/journal-entries')}>
                  View All
                </Button>
              }
            />
            <CardContent>
              {recentEntries.length === 0 ? (
                <EmptyState
                  title="No journal entries yet"
                  description="Entries appear here once a vendor bill is posted."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Journal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEntries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer"
                        onClick={() => navigate('/accounting/journal-entries')}
                      >
                        <TableCell>{entry.reference.replace(/#/g, '')}</TableCell>
                        <TableCell>{journalName(entry.journalId)}</TableCell>
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyText amount={entry.lines.reduce((sum, l) => sum + l.debit, 0)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {data.next_modules && data.next_modules.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Coming soon: {data.next_modules.join(', ')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
