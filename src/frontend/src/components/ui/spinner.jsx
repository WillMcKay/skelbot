import * as React from 'react'
import { LoaderCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner(
  {
    className,
    ...props
  }
) {
  return (
    <LoaderCircleIcon
      aria-label="Loading"
      className={cn('animate-spin', className)}
      role="status"
      data-slot="spinner"
      {...props}
    />
  )
}
