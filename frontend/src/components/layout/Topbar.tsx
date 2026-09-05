import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/useAuth'
import { ROLE_LABELS } from '@/features/auth/roles'
import { AnimatedThemeToggler } from './AnimatedThemeToggler'

export function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="font-semibold">Urban Furniture Accounting</div>
      {user && (
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right">
            <div className="font-medium leading-tight">{user.name}</div>
            <div className="text-xs text-muted-foreground leading-tight">
              {ROLE_LABELS[user.role]}
            </div>
          </div>
          <AnimatedThemeToggler variant="circle" />
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
            <LogOut className="size-4" />
          </Button>
        </div>
      )}
    </header>
  )
}
