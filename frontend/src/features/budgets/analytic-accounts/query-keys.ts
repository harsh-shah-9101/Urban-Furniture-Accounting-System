export const analyticAccountKeys = {
  all: ['analytic-accounts'] as const,
  lists: () => [...analyticAccountKeys.all, 'list'] as const,
}
