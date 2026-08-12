'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import {
  Plus,
  Trash2,
  Pencil,
  X,
  ImagePlus,
  ArrowUp,
  ArrowDown,
  Film,
} from 'lucide-react'
import {
  createArtwork,
  updateArtwork,
  deleteArtwork,
  addArtworkMedia,
  deleteArtworkMedia,
  reorderArtworkMedia,
} from '@/app/actions/studio'
import { uploadFile, mediaTypeFor } from '@/lib/blob-client'
import type { Artwork, ArtworkMedia, Collection } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileInput } from '@/components/ui/file-input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

function CollectionSelect({
  collections,
  defaultValue,
}: {
  collections: Collection[]
  defaultValue?: number | null
}) {
  return (
    <Select name="collection_id" defaultValue={defaultValue ? String(defaultValue) : 'none'}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No place / unassigned</SelectItem>
        {collections.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// The <Select> above uses "none" as a placeholder value since native <select>
// can't submit an empty string as a distinct option; normalize it back out
// right before the form data reaches the server action.
function normalizeCollectionId(formData: FormData) {
  if (formData.get('collection_id') === 'none') {
    formData.set('collection_id', '')
  }
}

function AddArtworkForm({ collections }: { collections: Collection[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      setImageUrl(await uploadFile(file, 'artworks'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function onSubmit(formData: FormData) {
    normalizeCollectionId(formData)
    startTransition(async () => {
      try {
        await createArtwork(formData)
        toast.success('Piece added to the gallery')
        formRef.current?.reset()
        setPreview(null)
        setImageUrl('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="grid gap-5 border border-border bg-card p-6 md:grid-cols-[220px_1fr]"
    >
      <div className="space-y-3">
        <div className="relative flex aspect-4/5 items-center justify-center overflow-hidden border border-dashed border-border bg-muted">
          {preview ? (
            <Image src={preview} alt="Preview" fill className="object-cover" />
          ) : (
            <span className="px-4 text-center text-xs text-muted-foreground">
              Image preview
            </span>
          )}
        </div>
        <input type="hidden" name="image_url" value={imageUrl} />
        <Field label="Upload image">
          <FileInput accept="image/*" disabled={uploading} onChange={onFileChosen} />
          {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
        </Field>
        <Field label="…or paste an image URL">
          <Input
            type="text"
            placeholder="https://…"
            disabled={uploading}
            onChange={(e) => {
              setImageUrl(e.target.value)
              setPreview(e.target.value || null)
            }}
          />
        </Field>
      </div>

      <div className="grid content-start gap-4">
        <Field label="Title">
          <Input name="title" placeholder="Morning Zoomies" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medium">
            <Input name="medium" placeholder="Acrylic on canvas · Stoneware · …" />
          </Field>
          <Field label="Year">
            <Input name="year" placeholder="2024" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <Select name="status" defaultValue="available">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Place">
            <CollectionSelect collections={collections} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            name="description"
            rows={3}
            placeholder="A few words about this piece…"
          />
        </Field>
        <div>
          <Button type="submit" disabled={pending || uploading}>
            <Plus className="size-4" />
            {pending ? 'Adding…' : uploading ? 'Uploading…' : 'Add piece'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function MediaThumb({ item, isFirst, isLast }: { item: ArtworkMedia; isFirst: boolean; isLast: boolean }) {
  const [pending, startTransition] = useTransition()

  function move(direction: 'up' | 'down') {
    const fd = new FormData()
    fd.set('id', String(item.id))
    fd.set('direction', direction)
    startTransition(async () => {
      try {
        await reorderArtworkMedia(fd)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Reorder failed')
      }
    })
  }

  function onDelete() {
    if (!confirm('Remove this from the carousel?')) return
    const fd = new FormData()
    fd.set('id', String(item.id))
    startTransition(async () => {
      try {
        await deleteArtworkMedia(fd)
        toast.success('Removed')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Delete failed')
      }
    })
  }

  return (
    <div className="relative aspect-square w-full shrink-0 overflow-hidden border border-border bg-muted">
      {item.media_type === 'video' ? (
        <video src={item.url} className="h-full w-full object-cover" muted />
      ) : (
        <Image src={item.url} alt="" fill className="object-cover" />
      )}
      {item.media_type === 'video' && (
        <span className="absolute left-1 top-1 flex items-center gap-1 bg-background/80 px-1.5 py-0.5 text-[10px] uppercase tracking-widest">
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
    </div>
  )
}

function ArtworkMediaManager({ artworkId, media }: { artworkId: number; media: ArtworkMedia[] }) {
  // Bumping this key remounts the file input, which is how we clear its
  // selection after a successful upload (Input doesn't forward a ref).
  const [inputKey, setInputKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()

  async function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    const chosen = Array.from(files)
    setUploading(true)
    try {
      const items = await Promise.all(
        chosen.map(async (file) => ({
          url: await uploadFile(file, 'artwork-media'),
          media_type: mediaTypeFor(file),
        })),
      )
      const fd = new FormData()
      fd.set('artwork_id', String(artworkId))
      fd.set('items', JSON.stringify(items))
      startTransition(async () => {
        try {
          await addArtworkMedia(fd)
          toast.success('Added to the carousel')
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

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
        Carousel — process photos &amp; videos
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        The main image above is always shown first. Add more photos or videos
        here (collecting materials, timelapses, the finished piece) — people
        can scroll through all of it when they click the piece.
      </p>
      {media.length > 0 && (
        <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {media.map((item, i) => (
            <MediaThumb
              key={item.id}
              item={item}
              isFirst={i === 0}
              isLast={i === media.length - 1}
            />
          ))}
        </div>
      )}
      <Field label="Add photos or videos">
        <FileInput
          key={inputKey}
          accept="image/*,video/*"
          multiple
          disabled={pending || uploading}
          onChange={onFilesChosen}
        />
        {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
      </Field>
    </div>
  )
}

function ArtworkRow({
  art,
  collections,
  media,
}: {
  art: Artwork
  collections: Collection[]
  media: ArtworkMedia[]
}) {
  const [editing, setEditing] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [pending, startTransition] = useTransition()

  function onUpdate(formData: FormData) {
    normalizeCollectionId(formData)
    startTransition(async () => {
      try {
        await updateArtwork(formData)
        toast.success('Piece updated')
        setEditing(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Update failed')
      }
    })
  }

  function onDelete() {
    if (!confirm(`Delete “${art.title}”? This cannot be undone.`)) return
    const fd = new FormData()
    fd.set('id', String(art.id))
    startTransition(async () => {
      try {
        await deleteArtwork(fd)
        toast.success('Piece removed')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Delete failed')
      }
    })
  }

  const collectionTitle = collections.find((c) => c.id === art.collection_id)?.title

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex gap-4">
        <div className="relative aspect-4/5 w-20 shrink-0 overflow-hidden bg-muted">
          <Image
            src={art.image_url || '/placeholder.svg'}
            alt={art.title}
            fill
            className="object-cover"
          />
        </div>

        {editing ? (
          <form action={onUpdate} className="flex-1 space-y-3">
            <input type="hidden" name="id" value={art.id} />
            <Input name="title" defaultValue={art.title} required />
            <div className="grid grid-cols-2 gap-3">
              <Input name="medium" defaultValue={art.medium} placeholder="Medium" />
              <Input name="year" defaultValue={art.year} placeholder="Year" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select name="status" defaultValue={art.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
              <CollectionSelect collections={collections} defaultValue={art.collection_id} />
            </div>
            <Textarea name="description" defaultValue={art.description} rows={2} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                <X className="size-4" /> Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-1 items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-lg leading-tight">{art.title}</h4>
                <span
                  className={
                    art.status === 'sold'
                      ? 'text-[10px] uppercase tracking-widest text-muted-foreground'
                      : 'text-[10px] uppercase tracking-widest text-accent'
                  }
                >
                  {art.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {[art.medium, art.year].filter(Boolean).join(', ')}
              </p>
              <p className="mt-0.5 text-xs uppercase tracking-widest text-muted-foreground">
                {collectionTitle ?? 'No place assigned'}
              </p>
              {art.description && (
                <p className="mt-1 line-clamp-2 max-w-md text-sm text-foreground/70">
                  {art.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setShowMedia((v) => !v)}
                aria-label="Manage carousel media"
              >
                <ImagePlus className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onDelete}
                disabled={pending}
                aria-label="Delete"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showMedia && <ArtworkMediaManager artworkId={art.id} media={media} />}
    </div>
  )
}

export function ArtworkManager({
  artworks,
  collections,
  mediaByArtwork,
}: {
  artworks: Artwork[]
  collections: Collection[]
  mediaByArtwork: Record<number, ArtworkMedia[]>
}) {
  return (
    <div className="space-y-8">
      <AddArtworkForm collections={collections} />
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {artworks.length} piece{artworks.length === 1 ? '' : 's'} in the gallery
        </h3>
        {artworks.map((art) => (
          <ArtworkRow
            key={art.id}
            art={art}
            collections={collections}
            media={mediaByArtwork[art.id] ?? []}
          />
        ))}
      </div>
    </div>
  )
}
