'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { ArrowUp, ArrowDown, Trash2, Film } from 'lucide-react'
import {
  addAboutPhotos,
  deleteAboutPhoto,
  reorderAboutPhoto,
} from '@/app/actions/studio'
import { uploadFile, mediaTypeFor } from '@/lib/blob-client'
import { Dropzone } from '@/components/ui/dropzone'
import { FileInput } from '@/components/ui/file-input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MediaCarousel } from '@/components/media-carousel'
import type { AboutPhoto } from '@/lib/types'
import { toast } from 'sonner'

function PhotoThumb({
  photo,
  isFirst,
  isLast,
}: {
  photo: AboutPhoto
  isFirst: boolean
  isLast: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [previewOpen, setPreviewOpen] = useState(false)

  function move(direction: 'up' | 'down') {
    const fd = new FormData()
    fd.set('id', String(photo.id))
    fd.set('direction', direction)
    startTransition(async () => {
      try {
        await reorderAboutPhoto(fd)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Reorder failed')
      }
    })
  }

  function onDelete() {
    if (!confirm('Remove this from the About page?')) return
    const fd = new FormData()
    fd.set('id', String(photo.id))
    startTransition(async () => {
      try {
        await deleteAboutPhoto(fd)
        toast.success('Removed')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Delete failed')
      }
    })
  }

  return (
    <div className="relative aspect-square w-full shrink-0 overflow-hidden border border-border bg-muted">
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        aria-label={`Preview this ${photo.media_type}`}
        className="absolute inset-0 h-full w-full cursor-zoom-in"
      >
        {photo.media_type === 'video' ? (
          <video src={photo.url} className="h-full w-full object-cover" muted />
        ) : (
          <Image src={photo.url} alt="" fill className="object-cover" />
        )}
      </button>
      {photo.media_type === 'video' && (
        <span className="pointer-events-none absolute left-1 top-1 flex items-center gap-1 bg-background/80 px-1.5 py-0.5 text-[10px] uppercase tracking-widest">
          <Film className="size-3" /> Video
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/80 p-1">
        <div className="flex gap-1">
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={pending || isFirst}
            onClick={() => move('up')}
            aria-label="Move earlier"
          >
            <ArrowUp className="size-3" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={pending || isLast}
            onClick={() => move('down')}
            aria-label="Move later"
          >
            <ArrowDown className="size-3" />
          </Button>
        </div>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          disabled={pending}
          onClick={onDelete}
          aria-label="Remove"
        >
          <Trash2 className="size-3 text-destructive" />
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent showCloseButton className="max-w-2xl overflow-hidden p-0 sm:rounded-none">
          <MediaCarousel
            items={[{ type: photo.media_type, url: photo.url }]}
            alt=""
            className="h-[70vh] sm:h-[75vh]"
            fit="contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AboutPhotosManager({ photos }: { photos: AboutPhoto[] }) {
  const [inputKey, setInputKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleFiles(chosen: File[]) {
    if (chosen.length === 0) return
    setUploading(true)
    try {
      const items = await Promise.all(
        chosen.map(async (file) => ({
          url: await uploadFile(file, 'about-photos'),
          media_type: mediaTypeFor(file),
        })),
      )
      const fd = new FormData()
      fd.set('items', JSON.stringify(items))
      startTransition(async () => {
        try {
          await addAboutPhotos(fd)
          toast.success('Added to the About page')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Something went wrong')
        }
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setInputKey((k) => k + 1)
    }
  }

  function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) handleFiles(Array.from(files))
  }

  return (
    <div className="border border-border bg-card p-5">
      <h3 className="font-serif text-lg">About page photos</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Shown as a carousel next to your bio — add as many process shots as
        you like (you at work, materials, the studio, etc.), and put them in
        whatever order tells the story best.
      </p>
      <Dropzone
        onFiles={handleFiles}
        disabled={pending || uploading}
        className="mt-4 border border-dashed border-border p-3"
      >
        {photos.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {photos.map((photo, i) => (
              <PhotoThumb
                key={photo.id}
                photo={photo}
                isFirst={i === 0}
                isLast={i === photos.length - 1}
              />
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Add photos or videos
          </Label>
          <FileInput
            key={inputKey}
            accept="image/*,video/*"
            multiple
            disabled={pending || uploading}
            onChange={onFilesChosen}
          />
          <p className="text-xs text-muted-foreground">
            {uploading ? 'Uploading…' : 'Or drag & drop photos/videos here'}
          </p>
        </div>
      </Dropzone>
    </div>
  )
}
