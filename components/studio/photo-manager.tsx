'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { updateLunaPhoto } from '@/app/actions/studio'
import { uploadFile } from '@/lib/blob-client'
import type { SiteContent } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { FileInput } from '@/components/ui/file-input'
import { Dropzone } from '@/components/ui/dropzone'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type PhotoSlot = {
  key: 'hero_image' | 'about_image'
  title: string
  help: string
  fallback: string
}

const SLOTS: PhotoSlot[] = [
  {
    key: 'hero_image',
    title: 'Homepage portrait',
    help: 'The large photo next to the homepage introduction. A tall (portrait) photo works best.',
    fallback: '/luna/hero.png',
  },
  {
    key: 'about_image',
    title: 'About page photo',
    help: 'The photo shown on the About page. A tall (portrait) photo works best.',
    fallback: '/luna/about.png',
  },
]

function PhotoCard({ slot, current }: { slot: PhotoSlot; current?: string }) {
  const [pending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const shown = preview ?? current ?? slot.fallback

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      setImageUrl(await uploadFile(file, 'luna'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateLunaPhoto(formData)
        toast.success('Photo updated')
        setPreview(null)
        setImageUrl('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed')
      }
    })
  }

  return (
    <form
      action={onSubmit}
      className="flex flex-col gap-4 border border-border bg-card p-5 sm:flex-row"
    >
      <input type="hidden" name="key" value={slot.key} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <Dropzone
        onFiles={(files) => handleFile(files[0])}
        disabled={uploading}
        className="relative aspect-4/5 w-full shrink-0 overflow-hidden bg-muted sm:w-40"
      >
        <Image
          src={shown}
          alt={`Current ${slot.title.toLowerCase()}`}
          fill
          sizes="160px"
          className="object-cover"
        />
      </Dropzone>
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <h3 className="font-serif text-lg">{slot.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{slot.help}</p>
        </div>
        <div className="mt-auto space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Choose a new photo
            </Label>
            <FileInput accept="image/*" disabled={uploading} onChange={onFileChosen} />
            <p className="text-xs text-muted-foreground">Or drag &amp; drop onto the photo</p>
          </div>
          <Button type="submit" disabled={pending || uploading}>
            {uploading ? 'Uploading…' : pending ? 'Saving…' : 'Save photo'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export function PhotoManager({ content }: { content: SiteContent }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Upload your photos here. These replace the starter images across the
        site right away.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        {SLOTS.map((slot) => (
          <PhotoCard key={slot.key} slot={slot} current={content[slot.key]} />
        ))}
      </div>
    </div>
  )
}
