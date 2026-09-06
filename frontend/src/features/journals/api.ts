import { apiDelete, apiGet, apiPatch, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Journal, JournalInput, JournalUpdateInput } from '@/types/accounting'

interface JournalDto {
  id: number
  name: string
  journal_type: Journal['type']
  default_debit_account_id: number | null
  default_credit_account_id: number | null
  archived: boolean
}

function fromDto(dto: JournalDto): Journal {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.journal_type,
    defaultDebitAccountId: dto.default_debit_account_id,
    defaultCreditAccountId: dto.default_credit_account_id,
    archived: dto.archived,
  }
}

function toDto(input: JournalInput) {
  return {
    name: input.name,
    journal_type: input.type,
    default_debit_account_id: input.defaultDebitAccountId,
    default_credit_account_id: input.defaultCreditAccountId,
  }
}

function toUpdateDto(input: JournalUpdateInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.type !== undefined && { journal_type: input.type }),
    ...(input.defaultDebitAccountId !== undefined && { default_debit_account_id: input.defaultDebitAccountId }),
    ...(input.defaultCreditAccountId !== undefined && { default_credit_account_id: input.defaultCreditAccountId }),
  }
}

export const journalsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<JournalDto[]>('/journals', roleHeaders(role))
    return dtos.map(fromDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<JournalDto>(`/journals/${id}`, roleHeaders(role))
    return fromDto(dto)
  },
  create: async (input: JournalInput, role?: BackendUserRole) => {
    const dto = await apiPost<JournalDto>('/journals', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  update: async (id: number, input: JournalUpdateInput, role?: BackendUserRole) => {
    const dto = await apiPatch<JournalDto>(`/journals/${id}`, toUpdateDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  remove: async (id: number, role?: BackendUserRole) => {
    await apiDelete<void>(`/journals/${id}`, roleHeaders(role))
  },
}
