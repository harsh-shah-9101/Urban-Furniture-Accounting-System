import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['customer', 'vendor', 'both']),
  email: z.string().email('Enter a valid email'),
  mobile: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().optional().or(z.literal('')),
  profileImageUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

export type ContactFormValues = z.infer<typeof contactSchema>
