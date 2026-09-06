import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/formatters'
import type { AchievedSource } from '../achieved'

export function AchievedSourcesDialog({
  open,
  onOpenChange,
  analyticName,
  sources,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  analyticName: string
  sources: AchievedSource[]
}) {
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Achieved for {analyticName}</DialogTitle>
        </DialogHeader>

        {sources.length === 0 ? (
          <EmptyState
            title="No invoices or bills yet"
            description="Achieved amounts appear once a Sales Invoice or Vendor Bill uses this analytic account within the budget period."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow
                  key={`${source.kind}-${source.id}`}
                  className="cursor-pointer"
                  onClick={() => {
                    onOpenChange(false)
                    navigate(source.kind === 'invoice' ? `/sales/invoices/${source.id}` : `/purchases/bills/${source.id}`)
                  }}
                >
                  <TableCell>
                    {source.kind === 'invoice' ? 'Sales Invoice' : 'Vendor Bill'} #
                    {source.documentNo ?? source.id}
                  </TableCell>
                  <TableCell>{formatDate(source.date)}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyText amount={source.amount} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
