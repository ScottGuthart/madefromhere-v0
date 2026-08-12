export type Collection = {
  id: number
  title: string
  description: string
  cover_image_url: string
  sort_order: number
  created_at: string
}

export type Artwork = {
  id: number
  title: string
  description: string
  image_url: string
  medium: string
  year: string
  status: 'available' | 'sold'
  sort_order: number
  collection_id: number | null
  created_at: string
}

export type ArtworkMedia = {
  id: number
  artwork_id: number
  media_type: 'image' | 'video'
  url: string
  caption: string
  sort_order: number
  created_at: string
}

export type Show = {
  id: number
  title: string
  venue: string
  location: string
  description: string
  start_date: string
  end_date: string | null
  url: string
  created_at: string
}

export type SiteContent = Record<string, string>
