import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { journalsApi } from './api'
import { journalKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { JournalInput } from '@/types/accounting'

export function useJournals() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({ queryKey: journalKeys.lists(), queryFn: () => journalsApi.list(role) })
}

export function useCreateJournal() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: JournalInput) => journalsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() })
      toast.success('Journal created')
    },
  })
}
