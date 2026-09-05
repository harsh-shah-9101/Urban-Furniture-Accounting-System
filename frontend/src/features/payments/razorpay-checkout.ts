const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

export interface RazorpayCheckoutResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayCheckoutOptions {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string }
  theme?: { color?: string }
  handler: (response: RazorpayCheckoutResponse) => void
  modal?: { ondismiss?: () => void }
}

interface RazorpayCheckoutInstance {
  open: () => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance
  }
}

let scriptPromise: Promise<boolean> | null = null

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_SRC
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
  return scriptPromise
}

/** Opens the Razorpay checkout modal; resolves with the payment response, or rejects if the script fails to load or the user cancels. */
export function openRazorpayCheckout(
  options: Omit<RazorpayCheckoutOptions, 'handler' | 'modal'>,
): Promise<RazorpayCheckoutResponse> {
  return loadRazorpayScript().then((loaded) => {
    if (!loaded || !window.Razorpay) {
      throw new Error('Failed to load Razorpay checkout.')
    }

    return new Promise<RazorpayCheckoutResponse>((resolve, reject) => {
      const checkout = new window.Razorpay!({
        ...options,
        handler: (response) => resolve(response),
        modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
      })
      checkout.open()
    })
  })
}
