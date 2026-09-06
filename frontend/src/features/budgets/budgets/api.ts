import { apiDelete, apiGet, apiPatch, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Budget, BudgetInput, BudgetUpdateInput } from '@/types/budgets'

interface BudgetDto {
  id: number
  name: string
  analytic_account_id: number | null
  budget_amount: string
  spent_amount: string
  remaining_amount: string
  start_date: string | null
  end_date: string | null
  archived: boolean
}

function fromDto(dto: BudgetDto): Budget {
  return {
    id: dto.id,
    name: dto.name,
    analyticAccountId: dto.analytic_account_id,
    budgetAmount: Number(dto.budget_amount),
    spentAmount: Number(dto.spent_amount),
    remainingAmount: Number(dto.remaining_amount),
    startDate: dto.start_date,
    endDate: dto.end_date,
    archived: dto.archived,
  }
}

function toDto(input: BudgetInput) {
  return {
    name: input.name,
    analytic_account_id: input.analyticAccountId,
    budget_amount: input.budgetAmount,
    start_date: input.startDate,
    end_date: input.endDate,
  }
}

function toUpdateDto(input: BudgetUpdateInput) {
  return {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.analyticAccountId !== undefined && { analytic_account_id: input.analyticAccountId }),
    ...(input.budgetAmount !== undefined && { budget_amount: input.budgetAmount }),
    ...(input.startDate !== undefined && { start_date: input.startDate }),
    ...(input.endDate !== undefined && { end_date: input.endDate }),
  }
}

export const budgetsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<BudgetDto[]>('/budgets', roleHeaders(role))
    return dtos.map(fromDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<BudgetDto>(`/budgets/${id}`, roleHeaders(role))
    return fromDto(dto)
  },
  create: async (input: BudgetInput, role?: BackendUserRole) => {
    const dto = await apiPost<BudgetDto>('/budgets', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  update: async (id: number, input: BudgetUpdateInput, role?: BackendUserRole) => {
    const dto = await apiPatch<BudgetDto>(`/budgets/${id}`, toUpdateDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  remove: async (id: number, role?: BackendUserRole) => {
    await apiDelete<void>(`/budgets/${id}`, roleHeaders(role))
  },
}
