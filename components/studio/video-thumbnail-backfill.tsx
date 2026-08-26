'use client'

import { useState, useTransition } from 'react'
import { getVideosNeedingThumbnails, setMediaThumbnail } from '@/app/actions/studio'
import { uploadFile } from '@/lib/blob-client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Grabs a still frame from a video already sitting in Blob storage, the
// same way lib/blob-client.ts does for a freshly chosen file — except this
// loads the video from its URL instead of a local File, since these are
// videos uploaded before thumbnail capture existed. Runs entirely in the
// browser; there's no server-side way to decode a video frame here.
function captureThumbnailFromUrl(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url

    function finish(blob: Blob | null) {
      resolve(blob)
    }

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, (video.duration || 0) / 2)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx || canvas.width === 0 || canvas.height === 0) {
        finish(null)
        return
      }
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.85)
      } catch {
        // A cross-origin video without permissive CORS headers "taints"
        // the canvas and throws here instead of failing earlier.
        finish(null)
      }
    }
    video.onerror = () => finish(null)
  })
}

export function VideoThumbnailBackfill() {
  const [pending, startTransition] = useTransition()
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<{ fixed: number; failed: number } | null>(null)

  function onClick() {
    startTransition(async () => {
      try {
        const videos = await getVideosNeedingThumbnails()
        if (videos.length === 0) {
          toast.success('Every video already has a thumbnail')
          setResult(null)
          return
        }
        setProgress({ done: 0, total: videos.length })

        let fixed = 0
        let failed = 0
        for (const v of videos) {
          try {
            const blob = await captureThumbnailFromUrl(v.url)
            if (!blob) throw new Error('No frame could be captured')
            const thumbFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
            const thumbnailUrl = await uploadFile(thumbFile, 'video-thumbs')
            const fd = new FormData()
            fd.set('table', v.table)
            fd.set('id', String(v.id))
            fd.set('thumbnail_url', thumbnailUrl)
            await setMediaThumbnail(fd)
            fixed++
          } catch {
            failed++
          }
          setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p))
        }

        setResult({ fixed, failed })
        if (failed > 0) {
          toast.error(`Generated ${fixed}, but ${failed} couldn't be captured`)
        } else {
          toast.success(`Generated ${fixed} thumbnail${fixed === 1 ? '' : 's'}`)
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setProgress(null)
      }
    })
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium">Video thumbnails</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Generates a real preview image for videos that don&apos;t have one yet, so they show a
          photo instead of a blank box. Safe to run more than once — if it doesn&apos;t work the
          first time, try again from Chrome.
        </p>
        {progress && (
          <p className="mt-1 text-xs text-muted-foreground">
            Working… {progress.done}/{progress.total}
          </p>
        )}
        {result && !progress && (
          <p className="mt-1 text-xs text-muted-foreground">
            Last run: generated {result.fixed}
            {result.failed > 0 ? `, couldn't capture ${result.failed}` : ''}.
          </p>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={pending}>
        {pending ? 'Working…' : 'Generate video thumbnails'}
      </Button>
    </div>
  )
}
