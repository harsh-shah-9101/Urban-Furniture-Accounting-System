import { useQuery } from '@tanstack/react-query'
import { journalEntriesApi } from './api'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'

export function useJournalEntries() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({
    queryKey: ['journal-entries', 'list'],
    queryFn: () => journalEntriesApi.list(role),
  })
}
