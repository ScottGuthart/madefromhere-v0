'use client'

import { useState, useTransition } from 'react'
import { fixExistingVideoContentTypes } from '@/app/actions/studio'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// A one-time (but safe to re-run) fix for videos that were uploaded with
// the wrong content type and show as a black box with a disabled play
// button instead of playing — see the comment above fixVideoContentType in
// app/actions/studio.ts for why. New uploads no longer have this problem;
// this repairs anything uploaded before that fix shipped.
export function VideoRepair() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    fixed: number
    alreadyOk: number
    failed: number
  } | null>(null)

  function onClick() {
    startTransition(async () => {
      try {
        const res = await fixExistingVideoContentTypes()
        setResult(res)
        if (res.failed > 0) {
          toast.error(`Fixed ${res.fixed}, but ${res.failed} couldn't be repaired`)
        } else if (res.fixed === 0) {
          toast.success('All videos were already fine — nothing to fix')
        } else {
          toast.success(`Fixed ${res.fixed} video${res.fixed === 1 ? '' : 's'}`)
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Repair failed')
      }
    })
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium">Video playback fix</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Repairs videos that show a black box instead of playing. Safe to run more than once.
        </p>
        {result && (
          <p className="mt-1 text-xs text-muted-foreground">
            Last run: fixed {result.fixed}, already OK {result.alreadyOk}
            {result.failed > 0 ? `, couldn't fix ${result.failed}` : ''}.
          </p>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={pending}>
        {pending ? 'Fixing…' : 'Fix existing videos'}
      </Button>
    </div>
  )
}
