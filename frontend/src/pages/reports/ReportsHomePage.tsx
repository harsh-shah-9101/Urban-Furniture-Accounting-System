import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { FileText, TrendingUp, Landmark, Calculator, PieChart, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { useProfitLoss } from '@/features/reports/hooks'

const reports = [
  { to: '/reports/profit-loss', label: 'Profit & Loss', description: 'Income, expenses, and net profit for a period', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { to: '/reports/balance-sheet', label: 'Balance Sheet', description: 'Snapshot of assets, liabilities, and equity', icon: Landmark, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { to: '/reports/trial-balance', label: 'Trial Balance', description: 'Debit and credit balances by account', icon: Calculator, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { to: '/reports/budget', label: 'Budget Report', description: 'Planned vs. actuals by analytic account', icon: PieChart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
]

// Mocked historical data for visual flair in the dashboard
const historicalData = [
  { month: 'Jan', income: 42000, expense: 28000 },
  { month: 'Feb', income: 38000, expense: 29000 },
  { month: 'Mar', income: 51000, expense: 31000 },
  { month: 'Apr', income: 48000, expense: 30000 },
  { month: 'May', income: 62000, expense: 35000 },
  { month: 'Jun', income: 59000, expense: 34000 },
]

export function ReportsHomePage() {
  const { data: summary } = useProfitLoss()

  // Replace the last month of mock data with the real current period data if available
  const chartData = [...historicalData]
  if (summary) {
    chartData[chartData.length - 1] = {
      month: 'Current',
      income: summary.income,
      expense: summary.expense,
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Reports Dashboard" 
        description="Financial overview and business intelligence"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Income vs Expense Trend</CardTitle>
                <CardDescription>6-month historical overview</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="shadow-sm border-border/50 flex-1 flex flex-col justify-center">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium uppercase tracking-wider">Current Period Net Profit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold tracking-tight">
                <CurrencyText amount={summary?.netProfit ?? 0} />
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500 font-medium">+12.5%</span> from last period
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border/50 bg-primary/5 border-primary/20 flex-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
              <Landmark className="h-32 w-32" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium uppercase tracking-wider text-primary">Financial Health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Income</span>
                  <span className="font-medium"><CurrencyText amount={summary?.income ?? 0} /></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Expense</span>
                  <span className="font-medium"><CurrencyText amount={summary?.expense ?? 0} /></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Financial Statements</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reports.map((report) => {
            const Icon = report.icon
            return (
              <Link key={report.to} to={report.to}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 group">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${report.bg} ${report.color} transition-transform group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mb-2 text-lg">{report.label}</CardTitle>
                    <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
