export interface RazorpayOrder {
  keyId: string
  providerOrderId: string
  amount: number
  currency: string
}

export interface RazorpayVerifyInput {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}
