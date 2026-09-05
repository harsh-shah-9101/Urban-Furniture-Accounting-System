import { useQuery } from '@tanstack/react-query'
import { customerPortalApi } from './api'
import { portalInvoiceKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'

const POLL_INTERVAL_MS = 15_000

export function usePortalInvoices() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({
    queryKey: portalInvoiceKeys.lists(),
    queryFn: () => customerPortalApi.listInvoices(role, user?.email),
    enabled: !!user?.email,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })
}

export function usePortalInvoice(id: number) {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({
    queryKey: portalInvoiceKeys.detail(id),
    queryFn: () => customerPortalApi.getInvoice(id, role, user?.email),
    enabled: !!user?.email && Number.isFinite(id),
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  })
}
