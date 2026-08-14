import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getSiteContent } from '@/lib/queries'
import { LoginForm } from '@/components/login-form'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Studio Login — Made From Here',
}

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect('/studio')
  }

  const content = await getSiteContent()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className="flex flex-col leading-none"
          aria-label="Made From Here — home"
        >
          <span className="font-serif text-2xl tracking-tight">made from here</span>
          <span className="mt-1 text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground">
            art rooted in place
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
          <Image
            src={content.logo_image ?? '/brand/from-here-studio.png'}
            alt="Made From Here"
            width={320}
            height={320}
            priority
            className="mx-auto mb-6 w-40"
          />
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">
            Private
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            The Studio
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Jackie&apos;s corner. Enter the password to add new work and
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
