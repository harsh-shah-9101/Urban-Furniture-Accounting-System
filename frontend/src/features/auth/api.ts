import { apiPost } from '@/lib/http'
import type { AuthResponse, LoginPayload, SignupPayload } from '@/types/auth'

export const authApi = {
  signup: (input: SignupPayload) => apiPost<AuthResponse>('/auth/signup', input),
  login: (input: LoginPayload) => apiPost<AuthResponse>('/auth/login', input),
}
