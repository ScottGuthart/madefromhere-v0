'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

// Wraps any upload area to also accept a drag-and-drop of files — including
// dragging straight out of the Photos app on a Mac, which just works via
// the standard browser drag-and-drop API, no special handling needed.
export function Dropzone({
  onFiles,
  disabled,
  className,
  children,
}: {
  onFiles: (files: File[]) => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      className={cn(
        'rounded-[inherit] transition-shadow',
        isOver && !disabled && 'ring-2 ring-accent ring-offset-2 ring-offset-background',
        className,
      )}
      onDragOver={(e) => {
        if (disabled) return
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        if (disabled) return
        const files = Array.from(e.dataTransfer.files).filter(
          (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
        )
        if (files.length > 0) onFiles(files)
      }}
    >
      {children}
    </div>
  )
}
