import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'

export interface ReportLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  backTo?: string
}

export function ReportLayout({ title, subtitle, children, backTo = '/reports' }: ReportLayoutProps) {
  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="print:hidden">
        <PageHeader
          title={title}
          backTo={backTo}
          actions={
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          }
        />
      </div>

      <div className="mt-6 print:mt-0">
        <Card className="overflow-hidden border-border/50 shadow-sm transition-all print:border-none print:shadow-none print:rounded-none">
          <CardHeader className="border-b border-border/50 bg-muted/20 px-8 py-8 text-center print:border-b-2 print:border-black print:bg-transparent">
            <h2 className="text-xl font-bold uppercase tracking-widest text-primary print:text-black">Urban Furniture Inc.</h2>
            <CardTitle className="mt-2 text-2xl font-semibold tracking-tight uppercase">
              {title}
            </CardTitle>
            {subtitle && <p className="mt-2 text-sm font-medium text-muted-foreground print:text-gray-600">{subtitle}</p>}
          </CardHeader>
          <CardContent className="px-8 py-8 print:px-0">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
