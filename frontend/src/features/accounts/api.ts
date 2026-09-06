import { apiDelete, apiGet, apiPatch, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Account, AccountInput, AccountUpdateInput } from '@/types/accounting'

interface AccountDto {
  id: number
  code: string
  name: string
  account_type: Account['type']
  archived: boolean
}

function fromDto(dto: AccountDto): Account {
  return { id: dto.id, code: dto.code, name: dto.name, type: dto.account_type, archived: dto.archived }
}

function toDto(input: AccountInput) {
  return { code: input.code, name: input.name, account_type: input.type }
}

function toUpdateDto(input: AccountUpdateInput) {
  return {
    ...(input.code !== undefined && { code: input.code }),
    ...(input.name !== undefined && { name: input.name }),
    ...(input.type !== undefined && { account_type: input.type }),
  }
}

export const accountsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<AccountDto[]>('/accounts', roleHeaders(role))
    return dtos.map(fromDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<AccountDto>(`/accounts/${id}`, roleHeaders(role))
    return fromDto(dto)
  },
  create: async (input: AccountInput, role?: BackendUserRole) => {
    const dto = await apiPost<AccountDto>('/accounts', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  update: async (id: number, input: AccountUpdateInput, role?: BackendUserRole) => {
    const dto = await apiPatch<AccountDto>(`/accounts/${id}`, toUpdateDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  remove: async (id: number, role?: BackendUserRole) => {
    await apiDelete<void>(`/accounts/${id}`, roleHeaders(role))
  },
}
