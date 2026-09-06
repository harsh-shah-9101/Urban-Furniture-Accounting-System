import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { ViewToggle, type DataViewMode } from '@/components/data-display/ViewToggle'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/features/products/hooks'
import { ProductKanbanView } from '@/features/products/components/ProductKanbanView'
import { ProductForm } from '@/features/products/components/ProductForm'
import type { Product } from '@/types/product'
import type { ProductFormValues } from '@/features/products/schema'

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

function EditProductDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const updateProduct = useUpdateProduct(product.id)

  function handleSubmit(values: ProductFormValues) {
    updateProduct.mutate(values, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <ProductForm
          defaultValues={{
            name: product.name,
            type: product.type,
            salesPrice: product.salesPrice,
            cost: product.cost,
            category: product.category,
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateProduct.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}

export function ProductListPage() {
  const { data: products, isLoading, isError } = useProducts()
  const createProduct = useCreateProduct()
  const deleteProduct = useDeleteProduct()
  const [view, setView] = useState<DataViewMode>(readStoredView)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  function handleViewChange(next: DataViewMode) {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  function handleCreateSubmit(values: ProductFormValues) {
    createProduct.mutate({ ...values, imageUrl: null }, {
      onSuccess: () => {
        setIsCreateOpen(false)
      },
    })
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
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingProduct(row.original)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeletingProduct(row.original)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Products"
        description="Goods, services, and combos"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Product
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Product</DialogTitle>
              </DialogHeader>
              <ProductForm onSubmit={handleCreateSubmit} isSubmitting={createProduct.isPending} />
            </DialogContent>
          </Dialog>
        }
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
            <ProductKanbanView products={filteredProducts} onSelect={setEditingProduct} />
          )}
        </div>
      )}

      {editingProduct && (
        <EditProductDialog product={editingProduct} onClose={() => setEditingProduct(null)} />
      )}

      <ConfirmDialog
        open={deletingProduct !== null}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title={`Delete ${deletingProduct?.name}?`}
        description="This permanently removes the product. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deletingProduct) deleteProduct.mutate(deletingProduct.id)
        }}
      />
    </div>
  )
}
