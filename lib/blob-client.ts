import { upload } from '@vercel/blob/client'

// Used by studio forms to upload a chosen file directly to Blob storage from
// the browser, then hand the server action just the resulting URL. See
// app/api/upload/route.ts for why this has to happen client-side.
export async function uploadFile(file: File, folder: string): Promise<string> {
  const blob = await upload(`${folder}/${Date.now()}-${file.name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    multipart: true,
  })
  return blob.url
}

export function mediaTypeFor(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image'
}
