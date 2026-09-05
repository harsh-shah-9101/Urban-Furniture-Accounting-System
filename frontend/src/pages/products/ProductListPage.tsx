import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { ViewToggle, type DataViewMode } from '@/components/data-display/ViewToggle'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProducts } from '@/features/products/hooks'
import { ProductKanbanView } from '@/features/products/components/ProductKanbanView'
import type { Product } from '@/types/product'

const TYPE_LABELS: Record<Product['type'], string> = {
  goods: 'Goods',
  service: 'Service',
  combo: 'Combo',
}

const VIEW_STORAGE_KEY = 'products:view-mode'

function readStoredView(): DataViewMode {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY)
  return stored === 'kanban' ? 'kanban' : 'list'
}

export function ProductListPage() {
  const { data: products, isLoading, isError } = useProducts()
  const navigate = useNavigate()
  const [view, setView] = useState<DataViewMode>(readStoredView)
  const [search, setSearch] = useState('')

  function handleViewChange(next: DataViewMode) {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const filteredProducts = useMemo(() => {
    if (!products) return []
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) =>
      [product.name, product.category]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    )
  }, [products, search])

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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="max-w-xs"
            />
            <ViewToggle value={view} onChange={handleViewChange} />
          </div>

          {view === 'list' ? (
            <DataTable
              columns={columns}
              data={products}
              emptyTitle="No products yet"
              emptyDescription="Add your first product to get started."
              searchValue={search}
              onSearchChange={setSearch}
              hideSearchInput
            />
          ) : (
            <ProductKanbanView products={filteredProducts} />
          )}
        </div>
      )}
    </div>
  )
}
