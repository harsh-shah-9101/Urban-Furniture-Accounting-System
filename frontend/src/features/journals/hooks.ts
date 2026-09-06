import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { journalsApi } from './api'
import { journalKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { JournalInput, JournalUpdateInput } from '@/types/accounting'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function useJournals() {
  const role = useRole()
  return useQuery({ queryKey: journalKeys.lists(), queryFn: () => journalsApi.list(role) })
}

export function useCreateJournal() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: JournalInput) => journalsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() })
      toast.success('Journal created')
    },
  })
}

export function useUpdateJournal(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: JournalUpdateInput) => journalsApi.update(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() })
      toast.success('Journal updated')
    },
  })
}

export function useDeleteJournal() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => journalsApi.remove(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() })
      toast.success('Journal deleted')
    },
  })
}
