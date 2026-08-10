import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { isAuthenticated } from '@/lib/auth'
import { logout } from '@/app/actions/auth'
import { getArtworks, getShows, getSiteContent } from '@/lib/queries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { ArtworkManager } from '@/components/studio/artwork-manager'
import { ShowManager } from '@/components/studio/show-manager'
import { ContentEditor } from '@/components/studio/content-editor'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Studio — Luna Paints',
}

export default async function StudioPage() {
  if (!(await isAuthenticated())) {
    redirect('/login')
  }

  const [artworks, shows, content] = await Promise.all([
    getArtworks(),
    getShows(),
    getSiteContent(),
  ])

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-xl font-semibold">Luna</span>
            <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              studio
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View site <ExternalLink className="size-3.5" />
            </Link>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back, Jackie
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage Luna&apos;s gallery, shows, and site content.
          </p>
        </div>

        <Tabs defaultValue="artwork">
          <TabsList>
            <TabsTrigger value="artwork">Gallery</TabsTrigger>
            <TabsTrigger value="shows">Shows</TabsTrigger>
            <TabsTrigger value="content">Site content</TabsTrigger>
          </TabsList>

          <TabsContent value="artwork" className="mt-6">
            <ArtworkManager artworks={artworks} />
          </TabsContent>
          <TabsContent value="shows" className="mt-6">
            <ShowManager shows={shows} />
          </TabsContent>
          <TabsContent value="content" className="mt-6">
            <ContentEditor content={content} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
