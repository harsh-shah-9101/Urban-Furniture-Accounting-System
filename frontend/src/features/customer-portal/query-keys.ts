export const portalInvoiceKeys = {
  all: ['customer-portal', 'invoices'] as const,
  lists: () => [...portalInvoiceKeys.all, 'list'] as const,
  detail: (id: number) => [...portalInvoiceKeys.all, 'detail', id] as const,
}
