import type { AnalyticAccount } from '@/types/accounting'

const now = new Date().toISOString()

export const analyticAccountsSeed: AnalyticAccount[] = [
  { id: 'aa-retail', name: 'Retail Showroom', type: 'income', archived: false, createdAt: now, updatedAt: now },
  { id: 'aa-online', name: 'Online Sales', type: 'income', archived: false, createdAt: now, updatedAt: now },
  { id: 'aa-workshop', name: 'Workshop & Production', type: 'expense', archived: false, createdAt: now, updatedAt: now },
]
