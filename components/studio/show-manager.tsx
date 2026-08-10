'use client'

import { useRef, useState, useTransition } from 'react'
import { Plus, Trash2, Pencil, X, MapPin } from 'lucide-react'
import { createShow, updateShow, deleteShow } from '@/app/actions/studio'
import type { Show } from '@/lib/types'
import { formatShowDate, toDateInput } from '@/lib/format'
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

function AddShowForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createShow(formData)
        toast.success('Show added to the calendar')
        formRef.current?.reset()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="grid gap-4 border border-border bg-card p-6"
    >
      <Field label="Show title">
        <Input name="title" placeholder="Paws & Pigment: A Solo Exhibition" required />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Venue">
          <Input name="venue" placeholder="The Little Dog Gallery" />
        </Field>
        <Field label="Location">
          <Input name="location" placeholder="Brooklyn, NY" />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Start date">
          <Input name="start_date" type="date" required />
        </Field>
        <Field label="End date (optional)">
          <Input name="end_date" type="date" />
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" rows={2} placeholder="What's on show…" />
      </Field>
      <Field label="Link (optional)">
        <Input name="url" type="url" placeholder="https://…" />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" />
          {pending ? 'Adding…' : 'Add show'}
        </Button>
      </div>
    </form>
  )
}

function ShowRow({ show }: { show: Show }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function onUpdate(formData: FormData) {
    startTransition(async () => {
      try {
        await updateShow(formData)
        toast.success('Show updated')
        setEditing(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Update failed')
      }
    })
  }

  function onDelete() {
    if (!confirm(`Delete “${show.title}”?`)) return
    const fd = new FormData()
    fd.set('id', String(show.id))
    startTransition(async () => {
      try {
        await deleteShow(fd)
        toast.success('Show removed')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Delete failed')
      }
    })
  }

  if (editing) {
    return (
      <form
        action={onUpdate}
        className="grid gap-4 border border-border bg-card p-6"
      >
        <input type="hidden" name="id" value={show.id} />
        <Field label="Show title">
          <Input name="title" defaultValue={show.title} required />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Venue">
            <Input name="venue" defaultValue={show.venue} />
          </Field>
          <Field label="Location">
            <Input name="location" defaultValue={show.location} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Start date">
            <Input name="start_date" type="date" defaultValue={toDateInput(show.start_date)} required />
          </Field>
          <Field label="End date">
            <Input name="end_date" type="date" defaultValue={toDateInput(show.end_date)} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea name="description" defaultValue={show.description} rows={2} />
        </Field>
        <Field label="Link">
          <Input name="url" type="url" defaultValue={show.url} />
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
    )
  }

  return (
    <div className="flex items-start justify-between gap-4 border border-border bg-card p-5">
      <div>
        <p className="font-serif text-sm text-accent">
          {formatShowDate(show.start_date, show.end_date)}
        </p>
        <h4 className="mt-0.5 font-serif text-xl leading-tight">{show.title}</h4>
        {(show.venue || show.location) && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {[show.venue, show.location].filter(Boolean).join(' · ')}
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
  )
}

export function ShowManager({ shows }: { shows: Show[] }) {
  return (
    <div className="space-y-8">
      <AddShowForm />
      <div className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {shows.length} show{shows.length === 1 ? '' : 's'} on the calendar
        </h3>
        {shows.map((show) => (
          <ShowRow key={show.id} show={show} />
        ))}
      </div>
    </div>
  )
}
