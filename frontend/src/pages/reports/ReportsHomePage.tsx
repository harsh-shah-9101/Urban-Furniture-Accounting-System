import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'

const reports = [
  { to: '/reports/balance-sheet', label: 'Balance Sheet', description: 'Assets, liabilities, and capital' },
  { to: '/reports/profit-loss', label: 'Profit & Loss', description: 'Net profit for a period' },
  { to: '/reports/budget', label: 'Budget Report', description: 'Planned vs. actual by analytic account' },
]

export function ReportsHomePage() {
  return (
    <div>
      <PageHeader title="Reports" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.to} to={report.to}>
            <Card className="transition-colors hover:bg-muted">
              <CardHeader>
                <CardTitle className="text-base">{report.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{report.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
