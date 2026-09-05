import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/features/auth/useAuth'
import { useDashboard } from '@/features/dashboard/hooks'
import { useSalesOrders } from '@/features/sales/hooks'
import { usePurchaseOrders } from '@/features/purchases/hooks'
import { useBudgets } from '@/features/budgets/budgets/hooks'
import { useJournalEntries } from '@/features/journal-entries/hooks'
import { useJournals } from '@/features/journals/hooks'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
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
        { label: 'Contacts', value: data.contacts },
        { label: 'Products', value: data.products },
        { label: 'Accounts', value: data.accounts },
        { label: 'Journals', value: data.journals },
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
              <Card key={card.label}>
                <CardHeader>
                  <CardTitle className="text-base">{card.label}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{card.value}</CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Sales</CardTitle>
                <Button size="sm" onClick={() => navigate('/sales/orders/new')}>
                  New
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <StatTile label="All" value={salesStats.all} />
                <StatTile label="Confirmed" value={salesStats.confirmed} />
                <StatTile label="Draft" value={salesStats.draft} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Purchase</CardTitle>
                <Button size="sm" onClick={() => navigate('/purchases/orders/new')}>
                  New
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <StatTile label="All" value={purchaseStats.all} />
                <StatTile label="Confirmed" value={purchaseStats.confirmed} />
                <StatTile label="Draft" value={purchaseStats.draft} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Budgets</CardTitle>
                <Button size="sm" onClick={() => navigate('/reports/budget')}>
                  Report
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <StatTile label="Total" value={budgetStats.total} />
                <StatTile label="Active" value={budgetStats.active} />
                <StatTile label="Archived" value={budgetStats.archived} />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Recent Journal Entries</CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate('/accounting/journal-entries')}>
                View All
              </Button>
            </CardHeader>
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
