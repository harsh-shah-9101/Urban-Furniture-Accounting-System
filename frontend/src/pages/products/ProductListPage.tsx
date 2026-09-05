import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/features/products/hooks'
import type { Product } from '@/types/product'

const TYPE_LABELS: Record<Product['type'], string> = {
  goods: 'Goods',
  service: 'Service',
  combo: 'Combo',
}

export function ProductListPage() {
  const { data: products, isLoading, isError } = useProducts()
  const navigate = useNavigate()

  const columns: ColumnDef<Product, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <Badge variant="secondary">{TYPE_LABELS[row.original.type]}</Badge>,
    },
    { accessorKey: 'category', header: 'Category' },
    {
      accessorKey: 'salesPrice',
      header: 'Sales Price',
      cell: ({ row }) => <CurrencyText amount={row.original.salesPrice} />,
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }) => <CurrencyText amount={row.original.cost} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        description="Goods, services, and combos"
        actions={<Button onClick={() => navigate('/products/new')}>New Product</Button>}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load products." />}
      {products && (
        <DataTable
          columns={columns}
          data={products}
          searchPlaceholder="Search products..."
          emptyTitle="No products yet"
          emptyDescription="Add your first product to get started."
        />
      )}
    </div>
  )
}
