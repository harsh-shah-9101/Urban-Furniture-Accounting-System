export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  detail: (id: number) => [...purchaseOrderKeys.all, 'detail', id] as const,
}

export const vendorBillKeys = {
  all: ['vendor-bills'] as const,
  lists: () => [...vendorBillKeys.all, 'list'] as const,
  detail: (id: number) => [...vendorBillKeys.all, 'detail', id] as const,
}
