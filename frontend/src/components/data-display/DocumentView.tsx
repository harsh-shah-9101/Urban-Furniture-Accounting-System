import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CurrencyText } from '@/components/data-display/CurrencyText'

export interface DocumentLine {
  id: string | number
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface DocumentParty {
  label: string
  name: string
  details: React.ReactNode
}

export interface DocumentViewProps {
  title: string
  icon: LucideIcon
  reference?: React.ReactNode
  status: React.ReactNode
  documentNoLabel: string
  documentNo: string
  leftParty: DocumentParty
  rightParty: DocumentParty
  lines: DocumentLine[]
  totalAmount: number
}

export function DocumentView({
  title,
  icon: Icon,
  reference,
  status,
  documentNoLabel,
  documentNo,
  leftParty,
  rightParty,
  lines,
  totalAmount,
}: DocumentViewProps) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md print:border-none print:shadow-none">
      <CardHeader className="bg-muted/30 border-b border-border/50 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Icon className="h-6 w-6 text-primary" />
              {title.toUpperCase()}
            </CardTitle>
            {reference && <div className="mt-2 text-sm text-muted-foreground">{reference}</div>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {status}
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">{documentNoLabel}</p>
              <p className="font-mono text-lg font-semibold">{documentNo}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-8 py-6">
        <div className="mb-8 grid grid-cols-2 gap-10">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {leftParty.label}
            </p>
            <p className="text-lg font-medium">{leftParty.name}</p>
            <div className="text-sm text-muted-foreground mt-1">{leftParty.details}</div>
          </div>
          <div className="text-right">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {rightParty.label}
            </p>
            <p className="text-lg font-medium">{rightParty.name}</p>
            <div className="text-sm text-muted-foreground mt-1">{rightParty.details}</div>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[45%] font-semibold">Description</TableHead>
                <TableHead className="text-right font-semibold">Qty</TableHead>
                <TableHead className="text-right font-semibold">Unit Price</TableHead>
                <TableHead className="text-right font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{line.description}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyText amount={line.unitPrice} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyText amount={line.lineTotal} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-1/2 rounded-lg bg-muted/30 p-4 border border-border/50">
            <div className="flex items-center justify-between font-semibold text-lg">
              <span>Total Amount</span>
              <CurrencyText amount={totalAmount} className="text-xl text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
