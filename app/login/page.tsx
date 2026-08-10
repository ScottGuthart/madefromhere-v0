import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { LoginForm } from '@/components/login-form'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Studio Login — Luna Paints',
}

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect('/studio')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold tracking-tight">
            Luna
          </span>
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            paints
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Back to site
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">
            Private
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            The Studio
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Jackie&apos;s corner. Enter the password to add new paintings and
            manage upcoming shows.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  )
}
