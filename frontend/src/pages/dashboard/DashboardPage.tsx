import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useAuth } from '@/features/auth/useAuth'
import { useDashboard } from '@/features/dashboard/hooks'

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useDashboard()

  const cards = data
    ? [
        { label: 'Contacts', value: data.contacts },
        { label: 'Products', value: data.products },
        { label: 'Accounts', value: data.accounts },
        { label: 'Journals', value: data.journals },
      ]
    : []

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
