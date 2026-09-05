import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import { useCreateAccount } from '@/features/accounts/hooks'
import type { AccountFormValues } from '@/features/accounts/schema'

export function AccountFormPage() {
  const navigate = useNavigate()
  const createAccount = useCreateAccount()

  function handleSubmit(values: AccountFormValues) {
    createAccount.mutate(values, { onSuccess: () => navigate('/accounting/chart-of-accounts') })
  }

  return (
    <div>
      <PageHeader title="New Account" backTo="/accounting/chart-of-accounts" />
      <AccountForm onSubmit={handleSubmit} isSubmitting={createAccount.isPending} />
    </div>
  )
}
