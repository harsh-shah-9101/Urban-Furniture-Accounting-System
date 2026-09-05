import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { FormError } from '@/components/feedback/FormError'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/features/auth/useAuth'
import { useSignup } from '@/features/auth/hooks'
import { signupSchema, SIGNUP_ROLES, type SignupFormValues } from '@/features/auth/schema'
import { ApiError } from '@/lib/http'

const ROLE_LABELS: Record<SignupFormValues['role'], string> = {
  admin: 'Admin (Business Owner)',
  accountant: 'Accountant',
  customer: 'Customer',
}

const fieldInputClass =
  'h-11 w-full rounded-lg border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function SignupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const signup = useSignup()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      login_id: '',
      email: '',
      password: '',
      confirm_password: '',
      role: 'customer',
    },
  })

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(values: SignupFormValues) {
    signup.mutate(values, {
      onSuccess: () => {
        toast.success('Account created. Please sign in.')
        navigate('/login', { replace: true })
      },
    })
  }

  const errorMessage =
    signup.error instanceof ApiError ? signup.error.message : signup.error ? 'Signup failed' : null

  return (
    <AuthLayout>
      <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Create an account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Set up your Urban Furniture Accounting access</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="name" label="Full name">
              {(field) => <Input {...field} placeholder="Your full name" className={fieldInputClass} />}
            </FormField>

            <FormField control={form.control} name="login_id" label="Login ID">
              {(field) => (
                <Input {...field} placeholder="6-12 chars: letters, numbers, _" className={fieldInputClass} />
              )}
            </FormField>
          </div>

          <FormField control={form.control} name="email" label="Email">
            {(field) => <Input {...field} type="email" placeholder="you@example.com" className={fieldInputClass} />}
          </FormField>

          <FormField control={form.control} name="role" label="Role">
            {(field) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={`${fieldInputClass} justify-between`}>
                  <SelectValue placeholder="Select role">
                    {(value: SignupFormValues['role']) => ROLE_LABELS[value]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SIGNUP_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="password" label="Password">
              {(field) => (
                <PasswordInput {...field} placeholder="At least 8 characters" className={fieldInputClass} />
              )}
            </FormField>

            <FormField control={form.control} name="confirm_password" label="Confirm password">
              {(field) => <PasswordInput {...field} placeholder="••••••••" className={fieldInputClass} />}
            </FormField>
          </div>

          <FormError message={errorMessage} />

          <Button
            type="submit"
            disabled={signup.isPending}
            className="mt-6 h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {signup.isPending ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
