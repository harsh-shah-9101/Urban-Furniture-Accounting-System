import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from './api'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'

export function useDashboard() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardApi.get(role) })
}
