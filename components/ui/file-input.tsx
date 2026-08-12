import * as React from 'react'

import { cn } from '@/lib/utils'

// A plain native <input type="file">, deliberately NOT built on the shared
// Input/@base-ui Field.Control wrapper. That wrapper's controlled-value and
// ref machinery is meant for text-like fields — on a file input it breaks
// the browser's own click-to-open-picker behavior (file inputs are
// special: their `value` can't be set programmatically, and most headless
// UI libraries explicitly don't support them). Keeping this native avoids
// that entirely.
function FileInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type="file"
      data-slot="file-input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent text-sm text-muted-foreground outline-none transition-colors file:mr-2.5 file:h-8 file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-input file:bg-muted file:px-2.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { FileInput }
