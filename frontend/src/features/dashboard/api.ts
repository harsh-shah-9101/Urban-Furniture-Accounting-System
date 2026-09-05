import { apiGet, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'

export interface DashboardStats {
  contacts: number
  products: number
  accounts: number
  journals: number
  next_modules?: string[]
}

export const dashboardApi = {
  get: (role?: BackendUserRole) => apiGet<DashboardStats>('/dashboard', roleHeaders(role)),
}
