import { useEffect, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle2, Loader2, QrCode } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { buildMockUpiOrder } from '../mock-payment'
import { useSimulateInvoicePayment } from '../hooks'

export function PayInvoiceDialog({
  invoiceId,
  amount,
  open,
  onOpenChange,
}: {
  invoiceId: number
  amount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const order = useMemo(() => buildMockUpiOrder(invoiceId, amount), [invoiceId, amount])
  const simulate = useSimulateInvoicePayment(invoiceId)

  useEffect(() => {
    if (open) simulate.mutate()
    // Re-run each time the dialog reopens so a closed-and-reopened dialog re-simulates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleClose(next: boolean) {
    if (!next) simulate.reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{simulate.isSuccess ? 'Payment Successful' : 'Scan to Pay'}</DialogTitle>
          <DialogDescription>
            {simulate.isSuccess ? (
              <>Invoice {invoiceId} · <CurrencyText amount={amount} /></>
            ) : (
              'Scan this QR with any UPI app to pay this invoice.'
            )}
          </DialogDescription>
        </DialogHeader>

        {simulate.isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-14 text-emerald-600 dark:text-emerald-400" />
            <div className="text-2xl font-semibold tabular-nums">
              <CurrencyText amount={amount} />
            </div>
            <div className="text-sm text-muted-foreground">Reference: {order.referenceId}</div>
            <div className="mt-1 max-w-xs text-xs text-muted-foreground">
              This invoice is now marked Paid. (Simulated payment — for demo purposes only.)
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-lg bg-white p-3 ring-1 ring-border">
              <QRCodeSVG value={order.upiUri} size={176} level="M" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Waiting for payment confirmation...
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <QrCode className="size-3.5" />
              Test environment — no real funds are transferred
            </div>
          </div>
        )}

        <DialogFooter>
          {simulate.isSuccess ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
