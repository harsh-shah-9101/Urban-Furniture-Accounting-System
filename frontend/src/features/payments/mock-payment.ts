/**
 * The backend's real Razorpay integration uses a LIVE key (rzp_live_…), so its checkout
 * cannot be exercised safely in this environment — every attempt either fails outright or
 * would risk a real charge. There's also no customer-facing endpoint to record a payment
 * directly (that action is staff-only). So the customer portal's "Pay" flow here is a
 * self-contained UI simulation: it renders a real, correctly-formatted UPI QR code (safe to
 * scan — the payee handle isn't a real account, so nothing can actually be paid to it) and
 * walks through the same "waiting for confirmation → success" beats a real gateway would,
 * without contacting any payment provider or mutating the invoice on the backend.
 */

export interface MockUpiOrder {
  /** upi:// deep link a UPI app would recognize and be able to render/scan. */
  upiUri: string
  /** Reference shown to the customer once the simulated payment "completes". */
  referenceId: string
}

const DEMO_PAYEE_VPA = 'urbanfurniture.demo@upi'
const DEMO_PAYEE_NAME = 'Urban Furniture Accounting'

export function buildMockUpiOrder(invoiceId: number, amount: number): MockUpiOrder {
  const note = `Invoice ${invoiceId}`
  const params = new URLSearchParams({
    pa: DEMO_PAYEE_VPA,
    pn: DEMO_PAYEE_NAME,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  })

  return {
    upiUri: `upi://pay?${params.toString()}`,
    referenceId: `DEMO-${Date.now().toString(36).toUpperCase()}`,
  }
}

/** Simulates the delay of a customer scanning the QR and completing payment in their UPI app. */
export function waitForMockPayment(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 12_000))
}
