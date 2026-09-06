import { apiDelete, apiGet, apiPatch, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { AnalyticAccount, AnalyticAccountInput, AnalyticAccountUpdateInput } from '@/types/accounting'
import { getAnalyticAccountType, setAnalyticAccountType } from './type-overlay'

interface AnalyticAccountDto {
  id: number
  name: string
  code: string
  description: string | null
  archived: boolean
}

function fromDto(dto: AnalyticAccountDto): AnalyticAccount {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    type: getAnalyticAccountType(dto.id),
    description: dto.description,
    archived: dto.archived,
  }
}

function toDto(input: AnalyticAccountInput) {
  return {
    name: input.name,
    code: input.code,
    description: input.description || null,
  }
}

function toUpdateDto(input: AnalyticAccountUpdateInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.code !== undefined && { code: input.code }),
    ...(input.description !== undefined && { description: input.description || null }),
  }
}

export const analyticAccountsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<AnalyticAccountDto[]>('/analytic-accounts', roleHeaders(role))
    return dtos.map(fromDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<AnalyticAccountDto>(`/analytic-accounts/${id}`, roleHeaders(role))
    return fromDto(dto)
  },
  create: async (input: AnalyticAccountInput, role?: BackendUserRole) => {
    const dto = await apiPost<AnalyticAccountDto>('/analytic-accounts', toDto(input), roleHeaders(role))
    setAnalyticAccountType(dto.id, input.type)
    return fromDto(dto)
  },
  update: async (id: number, input: AnalyticAccountUpdateInput, role?: BackendUserRole) => {
    const dto = await apiPatch<AnalyticAccountDto>(`/analytic-accounts/${id}`, toUpdateDto(input), roleHeaders(role))
    if (input.type !== undefined) setAnalyticAccountType(id, input.type)
    return fromDto(dto)
  },
  remove: async (id: number, role?: BackendUserRole) => {
    await apiDelete<void>(`/analytic-accounts/${id}`, roleHeaders(role))
  },
}
