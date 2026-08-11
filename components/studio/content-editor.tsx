'use client'

import { useTransition } from 'react'
import { updateContent } from '@/app/actions/studio'
import type { SiteContent } from '@/lib/types'
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

export function ContentEditor({ content }: { content: SiteContent }) {
  const [pending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updateContent(formData)
        toast.success('Site content saved')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <form
      action={onSubmit}
      className="max-w-2xl space-y-5 border border-border bg-card p-6"
    >
      <Field label="Homepage headline">
        <Input
          name="hero_tagline"
          defaultValue={content.hero_tagline ?? ''}
          placeholder="Original art by a very good cat"
        />
      </Field>
      <Field label="About page title">
        <Input
          name="about_title"
          defaultValue={content.about_title ?? ''}
          placeholder="Meet Luna"
        />
      </Field>
      <Field label="About page text (one paragraph per line)">
        <Textarea
          name="about_body"
          defaultValue={content.about_body ?? ''}
          rows={8}
        />
      </Field>
      <Field label="Contact email">
        <Input
          name="contact_email"
          type="email"
          defaultValue={content.contact_email ?? ''}
          placeholder="hello@fromherestudio.art"
        />
      </Field>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
