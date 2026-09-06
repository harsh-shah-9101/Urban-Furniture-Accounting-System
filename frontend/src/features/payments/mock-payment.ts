/**
 * The backend's real Razorpay integration uses a LIVE key (rzp_live_…), so its checkout
 * cannot be exercised safely in this environment — every attempt either fails outright or
 * would risk a real charge. So the customer portal's "Pay" flow here only simulates the
 * gateway itself: it renders a real, correctly-formatted UPI QR code (safe to scan — the
 * payee handle isn't a real account, so nothing can actually be paid to it) and walks through
 * the same "waiting for confirmation → success" beats a real gateway would, without ever
 * contacting Razorpay or any other payment provider. Once that simulated wait completes,
 * hooks.ts records a real payment via the customer-portal's own pay route (not Razorpay) so
 * the invoice is genuinely marked paid for both the customer and admin.
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
