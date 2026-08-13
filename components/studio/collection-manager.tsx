'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Pencil, X, MapPin } from 'lucide-react'
import {
  createCollection,
  updateCollection,
  deleteCollection,
} from '@/app/actions/studio'
import { uploadFile } from '@/lib/blob-client'
import { extractGpsFromFile } from '@/lib/exif-client'
import { parseGoogleMapsUrl } from '@/lib/geo'
import type { Collection } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileInput } from '@/components/ui/file-input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Coords = { lat: number; lng: number }

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

function LocationFields({
  coords,
  mapUrlText,
  locationNote,
  onMapUrlChange,
}: {
  coords: Coords | null
  mapUrlText: string
  locationNote: string | null
  onMapUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <>
      <Field label="Google Maps link (optional)">
        <Input
          type="text"
          placeholder="Paste a Google Maps link — or we'll try your photo's location"
          value={mapUrlText}
          onChange={onMapUrlChange}
        />
        {locationNote && (
          <p className="flex items-center gap-1 text-xs text-accent">
            <MapPin className="size-3" /> {locationNote}
          </p>
        )}
      </Field>
      <input type="hidden" name="latitude" value={coords?.lat ?? ''} />
      <input type="hidden" name="longitude" value={coords?.lng ?? ''} />
      <input type="hidden" name="map_url" value={mapUrlText} />
    </>
  )
}

function AddCollectionForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [mapUrlText, setMapUrlText] = useState('')
  const [locationNote, setLocationNote] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const [url, gps] = await Promise.all([
        uploadFile(file, 'collections'),
        extractGpsFromFile(file),
      ])
      setCoverUrl(url)
      if (gps) {
        setCoords(gps)
        setLocationNote('Location detected from this photo')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function onMapUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setMapUrlText(value)
    const parsed = parseGoogleMapsUrl(value)
    if (parsed) {
      setCoords(parsed)
      setLocationNote('Location set from the link')
    }
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createCollection(formData)
        toast.success('Place added')
        formRef.current?.reset()
        setPreview(null)
        setCoverUrl('')
        setCoords(null)
        setMapUrlText('')
        setLocationNote(null)
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
              Photo of the place
            </span>
          )}
        </div>
        <input type="hidden" name="cover_image_url" value={coverUrl} />
        <Field label="Upload photo">
          <FileInput accept="image/*" disabled={uploading} onChange={onFileChosen} />
          {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
        </Field>
      </div>

      <div className="grid content-start gap-4">
        <Field label="Place name">
          <Input name="title" placeholder="Lake 22" required />
        </Field>
        <Field label="Description">
          <Textarea
            name="description"
            rows={3}
            placeholder="A few words about this place…"
          />
        </Field>
        <LocationFields
          coords={coords}
          mapUrlText={mapUrlText}
          locationNote={locationNote}
          onMapUrlChange={onMapUrlChange}
        />
        <div>
          <Button type="submit" disabled={pending || uploading}>
            <Plus className="size-4" />
            {pending ? 'Adding…' : uploading ? 'Uploading…' : 'Add place'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function CollectionRow({ collection }: { collection: Collection }) {
  const [editing, setEditing] = useState(false)
  const [newCoverUrl, setNewCoverUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(
    collection.latitude != null && collection.longitude != null
      ? { lat: collection.latitude, lng: collection.longitude }
      : null,
  )
  const [mapUrlText, setMapUrlText] = useState(collection.map_url ?? '')
  const [locationNote, setLocationNote] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const [url, gps] = await Promise.all([
        uploadFile(file, 'collections'),
        extractGpsFromFile(file),
      ])
      setNewCoverUrl(url)
      if (gps) {
        setCoords(gps)
        setLocationNote('Location detected from this photo')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onMapUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setMapUrlText(value)
    const parsed = parseGoogleMapsUrl(value)
    if (parsed) {
      setCoords(parsed)
      setLocationNote('Location set from the link')
    }
  }

  function onUpdate(formData: FormData) {
    startTransition(async () => {
      try {
        await updateCollection(formData)
        toast.success('Place updated')
        setEditing(false)
        setNewCoverUrl('')
        setLocationNote(null)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Update failed')
      }
    })
  }

  function onDelete() {
    if (
      !confirm(
        `Delete “${collection.title}”? Pieces in it won't be deleted, but they'll no longer be grouped under this place.`,
      )
    )
      return
    const fd = new FormData()
    fd.set('id', String(collection.id))
    startTransition(async () => {
      try {
        await deleteCollection(fd)
        toast.success('Place removed')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Delete failed')
      }
    })
  }

  return (
    <div className="flex gap-4 border border-border bg-card p-4">
      <div className="relative aspect-4/5 w-20 shrink-0 overflow-hidden bg-muted">
        <Image
          src={collection.cover_image_url || '/placeholder.svg'}
          alt={collection.title}
          fill
          className="object-cover"
        />
      </div>

      {editing ? (
        <form action={onUpdate} className="flex-1 space-y-3">
          <input type="hidden" name="id" value={collection.id} />
          <Input name="title" defaultValue={collection.title} required />
          <Textarea name="description" defaultValue={collection.description} rows={2} />
          <input type="hidden" name="cover_image_url" value={newCoverUrl} />
          <Field label="Replace photo (optional)">
            <FileInput accept="image/*" disabled={uploading} onChange={onFileChosen} />
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
          </Field>
          <LocationFields
            coords={coords}
            mapUrlText={mapUrlText}
            locationNote={locationNote}
            onMapUrlChange={onMapUrlChange}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending || uploading}>
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
            <h4 className="font-serif text-lg leading-tight">{collection.title}</h4>
            {collection.description && (
              <p className="mt-1 line-clamp-2 max-w-md text-sm text-foreground/70">
                {collection.description}
              </p>
            )}
            {collection.latitude != null && collection.longitude != null && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" /> Location saved
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
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
  )
}

export function CollectionManager({ collections }: { collections: Collection[] }) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Group your gallery by the place each piece came from. Add a photo of
        the location itself here — then assign pieces to it from the Gallery
        tab. If your photo has location data, the map fills in
        automatically; otherwise paste a Google Maps link.
      </p>
      <AddCollectionForm />
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {collections.length} place{collections.length === 1 ? '' : 's'}
        </h3>
        {collections.map((c) => (
          <CollectionRow key={c.id} collection={c} />
        ))}
      </div>
    </div>
  )
}
