export type ContactType = 'customer' | 'vendor' | 'both'

export interface Contact {
  id: number
  name: string
  type: ContactType
  email: string
  mobile: string | null
  city: string | null
  state: string | null
  pincode: string | null
  profileImageUrl: string | null
}

export type ContactInput = Omit<Contact, 'id'>
