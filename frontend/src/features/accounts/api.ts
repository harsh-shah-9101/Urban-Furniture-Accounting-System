import { apiGet, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Account, AccountInput } from '@/types/accounting'

interface AccountDto {
  id: number
  code: string
  name: string
  account_type: Account['type']
}

function fromDto(dto: AccountDto): Account {
  return { id: dto.id, code: dto.code, name: dto.name, type: dto.account_type }
}

function toDto(input: AccountInput) {
  return { code: input.code, name: input.name, account_type: input.type }
}

export const accountsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<AccountDto[]>('/accounts', roleHeaders(role))
    return dtos.map(fromDto)
  },
  create: async (input: AccountInput, role?: BackendUserRole) => {
    const dto = await apiPost<AccountDto>('/accounts', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
}
