import { useState } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Pagination } from '@/components/data-display/Pagination'

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  searchPlaceholder?: string
  onRowClick?: (row: TData) => void
  emptyTitle?: string
  emptyDescription?: string
  /** Controlled search value. When provided along with onSearchChange, the table's filter is driven externally. */
  searchValue?: string
  onSearchChange?: (value: string) => void
  /** Hides the built-in search input, e.g. when a parent renders a shared search bar above list/kanban toggles. */
  hideSearchInput?: boolean
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onRowClick,
  emptyTitle = 'No records yet',
  emptyDescription,
  searchValue,
  onSearchChange,
  hideSearchInput = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [internalFilter, setInternalFilter] = useState('')
  const globalFilter = searchValue ?? internalFilter
  const setGlobalFilter = onSearchChange ?? setInternalFilter

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="flex flex-col gap-3">
      {!hideSearchInput && (
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-xs"
        />
      )}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="flex items-center gap-1 disabled:cursor-default"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <ArrowUpDown className="size-3" />}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        pageIndex={table.getState().pagination.pageIndex}
        pageCount={table.getPageCount()}
        onPageChange={(index) => table.setPageIndex(index)}
      />
    </div>
  )
}
