import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { isAuthenticated } from '@/lib/auth'
import { logout } from '@/app/actions/auth'
import {
  getArtworks,
  getArtworkMediaByArtwork,
  getCollections,
  getShows,
  getSiteContent,
} from '@/lib/queries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { ArtworkManager } from '@/components/studio/artwork-manager'
import { CollectionManager } from '@/components/studio/collection-manager'
import { ShowManager } from '@/components/studio/show-manager'
import { PhotoManager } from '@/components/studio/photo-manager'
import { ContentEditor } from '@/components/studio/content-editor'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Studio — From Here Studio',
}

export default async function StudioPage() {
  if (!(await isAuthenticated())) {
    redirect('/login')
  }

  const [artworks, collections, mediaMap, shows, content] = await Promise.all([
    getArtworks(),
    getCollections(),
    getArtworkMediaByArtwork(),
    getShows(),
    getSiteContent(),
  ])
  const mediaByArtwork = Object.fromEntries(mediaMap)

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xl tracking-tight">from here</span>
            <span className="mt-0.5 text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground">
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
            <TabsTrigger value="places">Places</TabsTrigger>
            <TabsTrigger value="artwork">Gallery</TabsTrigger>
            <TabsTrigger value="shows">Shows</TabsTrigger>
            <TabsTrigger value="photos">Luna&apos;s photos</TabsTrigger>
            <TabsTrigger value="content">Site content</TabsTrigger>
          </TabsList>

          <TabsContent value="places" className="mt-6">
            <CollectionManager collections={collections} />
          </TabsContent>
          <TabsContent value="artwork" className="mt-6">
            <ArtworkManager
              artworks={artworks}
              collections={collections}
              mediaByArtwork={mediaByArtwork}
            />
          </TabsContent>
          <TabsContent value="shows" className="mt-6">
            <ShowManager shows={shows} />
          </TabsContent>
          <TabsContent value="photos" className="mt-6">
            <PhotoManager content={content} />
          </TabsContent>
          <TabsContent value="content" className="mt-6">
            <ContentEditor content={content} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
