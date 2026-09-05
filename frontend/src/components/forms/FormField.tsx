import type { ReactElement } from 'react'
import type { Control, ControllerRenderProps, FieldValues, Path } from 'react-hook-form'
import {
  FormControl,
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> {
  control: Control<TFieldValues>
  name: TName
  label?: string
  children: (field: ControllerRenderProps<TFieldValues, TName>) => ReactElement
}

/**
 * Thin convenience wrapper around the shadcn Form primitives so feature forms don't
 * repeat the FormItem/FormLabel/FormControl/FormMessage scaffolding for every field.
 * `children` receives the react-hook-form field and must return the single control
 * element to render (FormControl merges its a11y props onto it via Base UI's `render`).
 */
export function FormField<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
>({ control, name, label, children }: FormFieldProps<TFieldValues, TName>) {
  return (
    <ShadcnFormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl render={children(field)} />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
