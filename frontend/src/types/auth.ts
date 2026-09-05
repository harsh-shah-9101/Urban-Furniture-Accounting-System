export type Role = 'admin' | 'invoicing_user' | 'contact'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  /** Set only for role === 'contact' — links the session back to their Contact master record. */
  contactId?: string
}

export interface Session {
  user: AuthUser
}

/** Roles as defined by the real backend (`/auth/signup`, `/auth/login`) — distinct from the app's mock-session `Role`. */
export type BackendUserRole = 'admin' | 'accountant' | 'customer'

export interface BackendUser {
  id: number
  name: string
  login_id: string
  email: string
  role: BackendUserRole
  is_active: boolean
  created_at: string
}

export interface SignupPayload {
  name: string
  login_id: string
  email: string
  password: string
  confirm_password: string
  role: BackendUserRole
}

export interface AuthResponse {
  user: BackendUser
  access_token: string
}

export interface LoginPayload {
  email?: string
  login_id?: string
  password: string
}
