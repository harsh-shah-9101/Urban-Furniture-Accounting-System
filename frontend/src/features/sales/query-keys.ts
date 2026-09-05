export const salesOrderKeys = {
  all: ['sales-orders'] as const,
  lists: () => [...salesOrderKeys.all, 'list'] as const,
  detail: (id: number) => [...salesOrderKeys.all, 'detail', id] as const,
}

export const customerInvoiceKeys = {
  all: ['customer-invoices'] as const,
  lists: () => [...customerInvoiceKeys.all, 'list'] as const,
  detail: (id: number) => [...customerInvoiceKeys.all, 'detail', id] as const,
}
