import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'luna_studio'

function getSecret() {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) throw new Error('ADMIN_PASSWORD is not set')
  return pw
}

// Deterministic token derived from the password. Changing the password
// invalidates all existing sessions.
function makeToken() {
  return createHmac('sha256', getSecret()).update('luna-studio-v1').digest('hex')
}

export function verifyPassword(input: string): boolean {
  const expected = Buffer.from(getSecret())
  const provided = Buffer.from(input)
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}

export async function createSession() {
  const store = await cookies()
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return false
  const expected = makeToken()
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
