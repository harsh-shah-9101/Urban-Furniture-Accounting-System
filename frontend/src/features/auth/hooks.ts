import { useMutation } from '@tanstack/react-query'
import { authApi } from './api'
import type { SignupPayload } from '@/types/auth'

export function useSignup() {
  return useMutation({
    mutationFn: (input: SignupPayload) => authApi.signup(input),
  })
}
