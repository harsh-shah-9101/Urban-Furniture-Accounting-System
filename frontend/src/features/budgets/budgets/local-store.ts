import type { Budget, BudgetInput, BudgetUpdateInput } from '@/types/budgets'

/**
 * The real backend's /budgets endpoint only models one analytic account and one amount per
 * budget — it has no draft/confirm/revise/cancel workflow, multiple lines, or revision links.
 * Rather than block this feature on a backend rewrite, budgets are modeled and persisted
 * entirely in the browser (localStorage), the same way the customer portal's UPI payment flow
 * is simulated client-side (see features/payments/mock-payment-store.ts). "Achieved" amounts
 * are deliberately never stored here — they're computed live from the real Sales Invoice /
 * Vendor Bill data instead (see achieved.ts), which the backend does support.
 */

const STORAGE_KEY = 'ufa:budgets'
const NEXT_ID_KEY = 'ufa:budgets:next-id'

function readAll(): Budget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Budget[]) : []
  } catch {
    return []
  }
}

function writeAll(budgets: Budget[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets))
  } catch {
    // Best-effort only — a private window or blocked storage just means budgets won't
    // persist across reloads, which is a harmless degradation here.
  }
}

function nextId(): number {
  const current = Number(localStorage.getItem(NEXT_ID_KEY) ?? '1') || 1
  localStorage.setItem(NEXT_ID_KEY, String(current + 1))
  return current
}

function requireBudget(budgets: Budget[], id: number): number {
  const index = budgets.findIndex((budget) => budget.id === id)
  if (index === -1) throw new Error(`Budget ${id} not found`)
  return index
}

export const budgetsStore = {
  list(): Budget[] {
    return readAll()
  },

  get(id: number): Budget | undefined {
    return readAll().find((budget) => budget.id === id)
  },

  create(input: BudgetInput): Budget {
    const budgets = readAll()
    const budget: Budget = {
      id: nextId(),
      name: input.name,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      status: 'draft',
      responsibleContactId: input.responsibleContactId ?? null,
      revisionOfId: null,
      revisedWithId: null,
      lines: input.lines.map((line, index) => ({
        id: index + 1,
        analyticAccountId: line.analyticAccountId,
        committedAmount: line.committedAmount,
      })),
    }
    writeAll([...budgets, budget])
    return budget
  },

  update(id: number, input: BudgetUpdateInput): Budget {
    const budgets = readAll()
    const index = requireBudget(budgets, id)
    const existing = budgets[index]
    const updated: Budget = {
      ...existing,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.startDate !== undefined && { startDate: input.startDate ?? null }),
      ...(input.endDate !== undefined && { endDate: input.endDate ?? null }),
      ...(input.responsibleContactId !== undefined && { responsibleContactId: input.responsibleContactId }),
      ...(input.lines !== undefined && {
        lines: input.lines.map((line, lineIndex) => ({
          id: existing.lines[lineIndex]?.id ?? lineIndex + 1,
          analyticAccountId: line.analyticAccountId,
          committedAmount: line.committedAmount,
        })),
      }),
    }
    budgets[index] = updated
    writeAll(budgets)
    return updated
  },

  remove(id: number) {
    writeAll(readAll().filter((budget) => budget.id !== id))
  },

  confirm(id: number): Budget {
    const budgets = readAll()
    const index = requireBudget(budgets, id)
    if (budgets[index].status !== 'draft') {
      throw new Error('Only draft budgets can be confirmed')
    }
    budgets[index] = { ...budgets[index], status: 'confirmed' }
    writeAll(budgets)
    return budgets[index]
  },

  cancel(id: number): Budget {
    const budgets = readAll()
    const index = requireBudget(budgets, id)
    if (budgets[index].status !== 'draft' && budgets[index].status !== 'confirmed') {
      throw new Error('Only draft or confirmed budgets can be cancelled')
    }
    budgets[index] = { ...budgets[index], status: 'cancelled' }
    writeAll(budgets)
    return budgets[index]
  },

  /** New budget appears in Draft (editable, e.g. to raise the committed limit); the old one moves to Revised. */
  revise(id: number): Budget {
    const budgets = readAll()
    const index = requireBudget(budgets, id)
    const original = budgets[index]
    if (original.status !== 'confirmed') {
      throw new Error('Only confirmed budgets can be revised')
    }
    const revised: Budget = {
      ...original,
      id: nextId(),
      name: `${original.name} Revised`,
      status: 'draft',
      revisionOfId: original.id,
      revisedWithId: null,
      lines: original.lines.map((line) => ({ ...line })),
    }
    budgets[index] = { ...original, status: 'revised', revisedWithId: revised.id }
    writeAll([...budgets, revised])
    return revised
  },
}
