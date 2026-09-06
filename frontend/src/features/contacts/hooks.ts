import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { contactsApi } from './api'
import { contactKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { ContactInput, ContactUpdateInput } from '@/types/contact'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function useContacts() {
  const role = useRole()
  return useQuery({ queryKey: contactKeys.lists(), queryFn: () => contactsApi.list(role) })
}

export function useContact(id: number) {
  const { data: contacts, ...rest } = useContacts()
  return { ...rest, data: contacts?.find((contact) => contact.id === id) }
}

export function useCreateContact() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ContactInput) => contactsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      toast.success('Contact created')
    },
  })
}

export function useUpdateContact(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ContactUpdateInput) => contactsApi.update(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      toast.success('Contact updated')
    },
  })
}

export function useDeleteContact() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => contactsApi.remove(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
      toast.success('Contact deleted')
    },
  })
}
