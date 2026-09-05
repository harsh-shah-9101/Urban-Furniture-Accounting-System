export type ID = string

export interface Timestamped {
  createdAt: string
  updatedAt: string
}

export type PaymentMethod = 'cash' | 'bank'

export interface Address {
  city: string
  state: string
  pincode: string
}
