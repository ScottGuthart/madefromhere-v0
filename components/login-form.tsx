'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Unlocking…' : 'Enter the studio'}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, undefined)

  return (
    <form action={formAction} className="w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="password">Studio password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      {state?.error && (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      )}
      <div className="mt-6">
        <SubmitButton />
      </div>
    </form>
  )
}
