'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import {
  createArtwork,
  updateArtwork,
  deleteArtwork,
} from '@/app/actions/studio'
import type { Artwork } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

function AddArtworkForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createArtwork(formData)
        toast.success('Piece added to the gallery')
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
              Image preview
            </span>
          )}
        </div>
        <Field label="Upload image">
          <Input
            type="file"
            name="image"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              setPreview(file ? URL.createObjectURL(file) : null)
            }}
          />
        </Field>
        <Field label="…or paste an image URL">
          <Input
            type="text"
            name="image_url"
            placeholder="https://…"
            onChange={(e) => setPreview(e.target.value || null)}
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
        <Field label="Description">
          <Textarea
            name="description"
            rows={3}
            placeholder="A few words about this piece…"
          />
        </Field>
        <div>
          <Button type="submit" disabled={pending}>
            <Plus className="size-4" />
            {pending ? 'Adding…' : 'Add piece'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function ArtworkRow({ art }: { art: Artwork }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function onUpdate(formData: FormData) {
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

  return (
    <div className="flex gap-4 border border-border bg-card p-4">
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
          <Select name="status" defaultValue={art.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
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

export function ArtworkManager({ artworks }: { artworks: Artwork[] }) {
  return (
    <div className="space-y-8">
      <AddArtworkForm />
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {artworks.length} piece{artworks.length === 1 ? '' : 's'} in the gallery
        </h3>
        {artworks.map((art) => (
          <ArtworkRow key={art.id} art={art} />
        ))}
      </div>
    </div>
  )
}
