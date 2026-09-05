import { apiGet, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { AnalyticAccount, AnalyticAccountInput } from '@/types/accounting'

interface AnalyticAccountDto {
  id: string
  name: string
  type: AnalyticAccount['type']
  archived: boolean
  created_at: string
  updated_at: string
}

function fromDto(dto: AnalyticAccountDto): AnalyticAccount {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    archived: dto.archived,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

function toDto(input: AnalyticAccountInput) {
  return {
    name: input.name,
    type: input.type,
  }
}

export const analyticAccountsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<AnalyticAccountDto[]>('/analytic-accounts', roleHeaders(role))
    return dtos.map(fromDto)
  },
  create: async (input: AnalyticAccountInput, role?: BackendUserRole) => {
    const dto = await apiPost<AnalyticAccountDto>('/analytic-accounts', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
}
