import { Field as FieldPrimitive } from '@base-ui/react/field'
import { cn } from '@/lib/utils'

export function Field(
  {
    className,
    ...props
  }
) {
  return (
    <FieldPrimitive.Root
      className={cn('w-full flex flex-col items-start gap-2', className)}
      data-slot="field"
      {...props}
    />
  )
}

export function FieldLabel(
  {
    className,
    ...props
  }
) {
  return (
    <FieldPrimitive.Label
      className={cn(
        'inline-flex items-center gap-2 font-medium text-base/4.5 text-foreground data-disabled:opacity-50 sm:text-sm/4',
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  )
}

export function FieldItem(
  {
    className,
    ...props
  }
) {
  return <FieldPrimitive.Item className={cn('flex', className)} data-slot="field-item" {...props} />
}

export function FieldDescription(
  {
    className,
    ...props
  }
) {
  return (
    <FieldPrimitive.Description
      className={cn('text-muted-foreground/80 text-xs', className)}
      data-slot="field-description"
      {...props}
    />
  )
}

export function FieldError(
  {
    className,
    ...props
  }
) {
  return (
    <FieldPrimitive.Error
      className={cn('text-destructive text-xs font-medium', className)}
      data-slot="field-error"
      {...props}
    />
  )
}

export const FieldControl = FieldPrimitive.Control
export const FieldValidity = FieldPrimitive.Validity

export { FieldPrimitive }

export function FieldGroup(
  {
    className,
    ...props
  }
) {
  return <div className={cn('space-y-4', className)} data-slot="field-group" {...props} />
}

export function FieldSeparator(
  {
    className,
    children,
    ...props
  }
) {
  return (
    <div className={cn('relative flex items-center', className)} data-slot="field-separator" {...props}>
      <div className="flex-1 border-t border-border"></div>
      {children && <div className="px-3 text-muted-foreground">{children}</div>}
      <div className="flex-1 border-t border-border"></div>
    </div>
  )
}
