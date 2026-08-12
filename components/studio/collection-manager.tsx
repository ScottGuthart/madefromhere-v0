'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import {
  createCollection,
  updateCollection,
  deleteCollection,
} from '@/app/actions/studio'
import type { Collection } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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

function AddCollectionForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createCollection(formData)
        toast.success('Place added')
        formRef.current?.reset()
        setPreview(null)
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
        <Field label="Upload photo">
          <Input
            type="file"
            name="cover_image"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              setPreview(file ? URL.createObjectURL(file) : null)
            }}
          />
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
        <div>
          <Button type="submit" disabled={pending}>
            <Plus className="size-4" />
            {pending ? 'Adding…' : 'Add place'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function CollectionRow({ collection }: { collection: Collection }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function onUpdate(formData: FormData) {
    startTransition(async () => {
      try {
        await updateCollection(formData)
        toast.success('Place updated')
        setEditing(false)
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
          <Field label="Replace photo (optional)">
            <Input type="file" name="cover_image" accept="image/*" />
          </Field>
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
            <h4 className="font-serif text-lg leading-tight">{collection.title}</h4>
            {collection.description && (
              <p className="mt-1 line-clamp-2 max-w-md text-sm text-foreground/70">
                {collection.description}
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
        tab.
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
