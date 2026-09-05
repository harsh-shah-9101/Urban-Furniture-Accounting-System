import { apiGet, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { JournalEntry, JournalEntryLine } from '@/types/accounting'

interface JournalEntryLineDto {
  id: number
  account_id: number
  partner_id: number | null
  debit: string
  credit: string
}

interface JournalEntryDto {
  id: number
  journal_id: number
  reference: string
  status: string
  lines: JournalEntryLineDto[]
}

function fromLineDto(dto: JournalEntryLineDto): JournalEntryLine {
  return {
    id: dto.id,
    accountId: dto.account_id,
    partnerId: dto.partner_id,
    debit: Number(dto.debit),
    credit: Number(dto.credit),
  }
}

function fromDto(dto: JournalEntryDto): JournalEntry {
  return {
    id: dto.id,
    journalId: dto.journal_id,
    reference: dto.reference,
    status: dto.status,
    lines: dto.lines.map(fromLineDto),
  }
}

export const journalEntriesApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<JournalEntryDto[]>('/journal-entries', roleHeaders(role))
    return dtos.map(fromDto)
  },
}
