import { upload } from '@vercel/blob/client'

// Used by studio forms to upload a chosen file directly to Blob storage from
// the browser, then hand the server action just the resulting URL. See
// app/api/upload/route.ts for why this has to happen client-side.
export async function uploadFile(file: File, folder: string): Promise<string> {
  const blob = await upload(`${folder}/${Date.now()}-${file.name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    multipart: true,
    // Without this, Blob storage guesses the content type from the
    // filename's extension — and phone-captured videos often arrive with
    // no extension, or one it doesn't recognize, so it silently falls back
    // to a generic binary type. A video served that way can't be played
    // inline by any browser at all — no amount of preload tuning fixes
    // that, since the browser never even recognizes it as a video. The
    // File object's own `type` (set by the OS/browser at pick-time) is a
    // far more reliable source of truth than parsing the filename.
    contentType: file.type || undefined,
  })
  return blob.url
}

export function mediaTypeFor(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

// Grabs a still frame from a video file entirely in the browser (an
// off-screen <video> + <canvas>), so a real thumbnail can be shown for it
// immediately, everywhere, without any visitor's browser ever downloading
// part of the actual video just to get a first frame. Returns null if
// anything about the capture fails — callers should treat that as "no
// thumbnail available" rather than fail the whole upload over it.
function captureVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = objectUrl

    function finish(blob: Blob | null) {
      URL.revokeObjectURL(objectUrl)
      resolve(blob)
    }

    video.onloadedmetadata = () => {
      // A little past the very start — many videos open on a black or
      // transitional frame at exactly 0s.
      video.currentTime = Math.min(0.1, (video.duration || 0) / 2)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx || canvas.width === 0 || canvas.height === 0) {
        finish(null)
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.85)
    }
    video.onerror = () => finish(null)
  })
}

export type UploadedMediaItem = {
  url: string
  media_type: 'image' | 'video'
  thumbnail_url: string | null
}

// Uploads a photo or video and, for a video, also captures and uploads a
// still-frame thumbnail — used everywhere a piece's carousel or the About
// page's photos accept video, so new uploads never end up with the blank
// black box a video with no thumbnail shows until you tap play.
export async function uploadMediaItem(file: File, folder: string): Promise<UploadedMediaItem> {
  const media_type = mediaTypeFor(file)
  const url = await uploadFile(file, folder)

  let thumbnail_url: string | null = null
  if (media_type === 'video') {
    try {
      const thumb = await captureVideoThumbnail(file)
      if (thumb) {
        const thumbFile = new File([thumb], 'thumbnail.jpg', { type: 'image/jpeg' })
        thumbnail_url = await uploadFile(thumbFile, `${folder}-thumbs`)
      }
    } catch {
      // No thumbnail is a cosmetic downgrade (falls back to the old
      // metadata-preload look), not worth failing the whole upload over.
    }
  }

  return { url, media_type, thumbnail_url }
}
