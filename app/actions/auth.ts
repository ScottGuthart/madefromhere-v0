'use server'

import { redirect } from 'next/navigation'
import { createSession, destroySession, verifyPassword } from '@/lib/auth'

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const password = String(formData.get('password') ?? '')
  if (!verifyPassword(password)) {
    return { error: 'That password is not quite right. Try again.' }
  }
  await createSession()
  redirect('/studio')
}

export async function logout() {
  await destroySession()
  redirect('/')
}
