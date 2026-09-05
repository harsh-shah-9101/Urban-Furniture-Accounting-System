import type { BackendUserRole, Role } from '@/types/auth'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin (Business Owner)',
  invoicing_user: 'Invoicing User (Accountant)',
  contact: 'Contact',
}

/** Maps the real backend's role enum onto the app's session `Role`. */
export function fromBackendRole(role: BackendUserRole): Role {
  switch (role) {
    case 'admin':
      return 'admin'
    case 'accountant':
      return 'invoicing_user'
    case 'customer':
      return 'contact'
  }
}

/** Reverse of `fromBackendRole` — used to build the `x-user-role` header on API calls. */
export function toBackendRole(role: Role): BackendUserRole {
  switch (role) {
    case 'admin':
      return 'admin'
    case 'invoicing_user':
      return 'accountant'
    case 'contact':
      return 'customer'
  }
}
