import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { JournalForm } from '@/features/journals/components/JournalForm'
import { useCreateJournal } from '@/features/journals/hooks'
import type { JournalFormValues } from '@/features/journals/schema'

export function JournalFormPage() {
  const navigate = useNavigate()
  const createJournal = useCreateJournal()

  function handleSubmit(values: JournalFormValues) {
    createJournal.mutate(values, { onSuccess: () => navigate('/accounting/journals') })
  }

  return (
    <div>
      <PageHeader title="New Journal" />
      <JournalForm onSubmit={handleSubmit} isSubmitting={createJournal.isPending} />
    </div>
  )
}
