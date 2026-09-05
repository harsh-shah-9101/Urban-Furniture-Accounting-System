import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Pagination({
  pageIndex,
  pageCount,
  onPageChange,
}: {
  pageIndex: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
}) {
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {pageIndex + 1} of {pageCount}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={pageIndex >= pageCount - 1}
          onClick={() => onPageChange(pageIndex + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
