import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from './api'
import { contactKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { ContactInput } from '@/types/contact'

export function useContacts() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({ queryKey: contactKeys.lists(), queryFn: () => contactsApi.list(role) })
}

export function useContact(id: number) {
  const { data: contacts, ...rest } = useContacts()
  return { ...rest, data: contacts?.find((contact) => contact.id === id) }
}

export function useCreateContact() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ContactInput) => contactsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      toast.success('Contact created')
    },
  })
}
