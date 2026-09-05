import { apiGet, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Budget, BudgetInput } from '@/types/budgets'

interface BudgetDto {
  id: string
  name: string
  analytic_account_id: string
  period_start: string
  period_end: string
  responsible_person: string
  planned_amount: string
  archived: boolean
  created_at: string
  updated_at: string
}

function fromDto(dto: BudgetDto): Budget {
  return {
    id: dto.id,
    name: dto.name,
    analyticAccountId: dto.analytic_account_id,
    periodStart: dto.period_start,
    periodEnd: dto.period_end,
    responsiblePerson: dto.responsible_person,
    plannedAmount: Number(dto.planned_amount),
    archived: dto.archived,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

function toDto(input: BudgetInput) {
  return {
    name: input.name,
    analytic_account_id: input.analyticAccountId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    responsible_person: input.responsiblePerson,
    planned_amount: input.plannedAmount,
  }
}

export const budgetsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<BudgetDto[]>('/budgets', roleHeaders(role))
    return dtos.map(fromDto)
  },
  create: async (input: BudgetInput, role?: BackendUserRole) => {
    const dto = await apiPost<BudgetDto>('/budgets', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
}
