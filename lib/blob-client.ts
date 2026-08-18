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
