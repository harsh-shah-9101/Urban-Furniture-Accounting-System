import { useEffect, useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

export function CurrencyInput({
  value,
  onChange,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(value === 0 ? '' : String(value))

  useEffect(() => {
    const parsed = text === '' ? 0 : Number(text)
    if (parsed !== value) {
      setText(value === 0 ? '' : String(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

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
        value={text}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          onChange(raw === '' ? 0 : Number(raw))
        }}
        {...props}
      />
    </div>
  )
}
