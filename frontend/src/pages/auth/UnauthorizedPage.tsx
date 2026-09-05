import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'

export function UnauthorizedPage() {
  const { user } = useAuth()
  const homePath = user?.role === 'contact' ? '/portal/invoices' : '/dashboard'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="text-2xl font-semibold">You don't have access to this page</h1>
      <p className="text-muted-foreground">
        Your account role doesn't permit viewing this section.
      </p>
      <Button render={<Link to={homePath} />}>Back to safety</Button>
    </div>
  )
}
