import { useMemo, useState } from 'react'
import { Package, Receipt, Tag, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { cn } from '@/lib/utils'
import type { Product, ProductType } from '@/types/product'

type FilterValue = 'all' | ProductType

const TYPE_LABELS: Record<ProductType, string> = {
  goods: 'Goods',
  service: 'Service',
  combo: 'Combo',
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'goods', label: 'Goods' },
  { value: 'service', label: 'Services' },
  { value: 'combo', label: 'Combos' },
]

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/30">
      <div className="flex items-center gap-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="size-9 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Package className="size-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="text-xs text-muted-foreground">{TYPE_LABELS[product.type]}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3 text-sm text-foreground">
        <div className="flex items-center gap-2">
          <Tag className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{product.category || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="size-3.5 shrink-0 text-muted-foreground" />
          <span>
            Sales <CurrencyText amount={product.salesPrice} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="size-3.5 shrink-0 text-muted-foreground" />
          <span>
            Cost <CurrencyText amount={product.cost} />
          </span>
        </div>
      </div>
    </div>
  )
}

export function ProductKanbanView({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<FilterValue>('all')

  const counts = useMemo(() => {
    const result: Record<FilterValue, number> = { all: products.length, goods: 0, service: 0, combo: 0 }
    for (const product of products) result[product.type]++
    return result
  }, [products])

  const visibleProducts = filter === 'all' ? products : products.filter((p) => p.type === filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
        {FILTERS.map(({ value, label }) => {
          const isActive = filter === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs leading-none',
                  isActive ? 'bg-muted text-muted-foreground' : 'bg-muted/70 text-muted-foreground'
                )}
              >
                {counts[value]}
              </span>
            </button>
          )
        })}
      </div>

      {visibleProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try a different filter or search, or add your first product."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
