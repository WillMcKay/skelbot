'use client';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Toggle as ToggleComponent } from '@/components/ui/toggle';

export const ToggleGroupContext = React.createContext({
  size: 'default',
  variant: 'default',
})

export function ToggleGroup(
  {
    className,
    variant = 'default',
    size = 'default',
    orientation = 'horizontal',
    children,
    ...props
  }
) {
  return (
    <ToggleGroupPrimitive
      className={cn(
        'flex w-fit items-center rounded-lg bg-accent p-0.5 gap-0.5 *:focus-visible:z-10',
        orientation === 'horizontal'
          ? 'flex-row *:pointer-coarse:after:min-w-auto'
          : 'flex-col *:pointer-coarse:after:min-h-auto',
        className,
      )}
      data-size={size}
      data-slot="toggle-group"
      data-variant={variant}
      orientation={orientation}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ size, variant }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

export function ToggleGroupItem(
  {
    className,
    children,
    variant,
    size,
    ...props
  }
) {
  const context = React.useContext(ToggleGroupContext)

  const resolvedVariant = context.variant || variant
  const resolvedSize = context.size || size

  return (
    <ToggleComponent
      className={cn(
        'border-0 bg-muted hover:bg-background/80 text-foreground data-pressed:bg-background data-pressed:text-foreground shadow-none before:hidden',
        className,
      )}
      data-size={resolvedSize}
      data-variant={resolvedVariant}
      size={resolvedSize}
      variant={resolvedVariant}
      {...props}
    >
      {children}
    </ToggleComponent>
  )
}

export function ToggleGroupSeparator(
  {
    className,
    orientation = 'vertical',
    ...props
  }
) {
  return (
    <Separator
      className={cn(
        'pointer-events-none relative bg-border/50',
        orientation === 'vertical' ? 'h-5 w-px self-center my-0.5' : 'w-5 h-px self-center mx-0.5',
        className,
      )}
      orientation={orientation}
      {...props}
    />
  )
}

export { ToggleGroupPrimitive }
