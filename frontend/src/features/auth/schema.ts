import { z } from 'zod'

export const SIGNUP_ROLES = ['admin', 'accountant', 'customer'] as const

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name is too long'),
    login_id: z
      .string()
      .min(6, 'Login ID must be at least 6 characters')
      .max(12, 'Login ID must be at most 12 characters')
      .regex(/^[A-Za-z0-9_]+$/, 'Only letters, numbers, and underscores are allowed'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(8, 'Please confirm your password'),
    role: z.enum(SIGNUP_ROLES),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type SignupFormValues = z.infer<typeof signupSchema>
