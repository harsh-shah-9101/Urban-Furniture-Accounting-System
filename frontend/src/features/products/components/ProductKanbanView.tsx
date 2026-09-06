import { useMemo, useState, type ReactNode } from 'react'
import {
  Armchair,
  Boxes,
  Hammer,
  Lamp,
  Layers,
  Package,
  Palette,
  Receipt,
  Shirt,
  Sofa,
  Tag,
  TreePine,
  Utensils,
  Wallet,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { cn } from '@/lib/utils'
import { getAvatarColor } from '@/lib/avatar'
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
]

const CATEGORY_ICONS: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ['sofa', 'couch'], icon: Sofa },
  { keywords: ['chair', 'seat', 'furniture'], icon: Armchair },
  { keywords: ['light', 'lamp'], icon: Lamp },
  { keywords: ['storage', 'warehouse'], icon: Warehouse },
  { keywords: ['raw material', 'wood', 'timber', 'lumber'], icon: TreePine },
  { keywords: ['decor', 'paint'], icon: Palette },
  { keywords: ['hardware', 'tool'], icon: Hammer },
  { keywords: ['fabric', 'textile', 'upholstery', 'cushion'], icon: Shirt },
  { keywords: ['kitchen', 'dining'], icon: Utensils },
  { keywords: ['box', 'packag'], icon: Boxes },
]

function getCategoryIcon(product: Product): LucideIcon {
  const category = product.category?.toLowerCase() ?? ''
  const match = CATEGORY_ICONS.find(({ keywords }) => keywords.some((keyword) => category.includes(keyword)))
  if (match) return match.icon
  if (product.type === 'service') return Wrench
  if (product.type === 'combo') return Layers
  return Package
}

function InfoRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
      <span className="truncate">{children}</span>
    </div>
  )
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const CategoryIcon = getCategoryIcon(product)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card p-5 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:shadow-primary/5"
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover ring-1 ring-border/50"
            />
          ) : (
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-border/50',
                getAvatarColor(product.name),
              )}
            >
              <CategoryIcon className="size-4" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium leading-none text-foreground">{product.name}</h3>
            <p className="mt-1.5 truncate text-xs text-muted-foreground">
              {TYPE_LABELS[product.type]} • <span className="font-mono text-muted-foreground/70">#{String(product.id).padStart(4, '0')}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 text-xs text-muted-foreground">
        <InfoRow icon={Tag}>{product.category || '—'}</InfoRow>
        <InfoRow icon={Wallet}>
          Sales <CurrencyText amount={product.salesPrice} />
        </InfoRow>
        <InfoRow icon={Receipt}>
          Cost <CurrencyText amount={product.cost} />
        </InfoRow>
      </div>
    </button>
  )
}

export function ProductKanbanView({
  products,
  onSelect,
}: {
  products: Product[]
  onSelect: (product: Product) => void
}) {
  const [filter, setFilter] = useState<FilterValue>('all')

  const counts = useMemo(() => {
    const result: Record<FilterValue, number> = { all: products.length, goods: 0, service: 0 }
    for (const product of products) {
      if (product.type === 'goods' || product.type === 'service') result[product.type]++
    }
    return result
  }, [products])

  const visibleProducts = filter === 'all' ? products : products.filter((p) => p.type === filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(({ value, label }) => {
          const isActive = filter === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-background border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {label}
              <span
                className={cn(
                  'ml-2.5 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  isActive 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted-foreground/10 text-muted-foreground'
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
            <ProductCard key={product.id} product={product} onClick={() => onSelect(product)} />
          ))}
        </div>
      )}
    </div>
  )
}
