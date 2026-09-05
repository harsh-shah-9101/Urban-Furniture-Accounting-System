import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

export function CurrencyInput({
  value,
  onChange,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>
      <Input
        type="number"
        step="0.01"
        min={0}
        className="pl-6"
        value={Number.isNaN(value) ? '' : value}
        onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        {...props}
      />
    </div>
  )
}
