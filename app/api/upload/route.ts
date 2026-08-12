import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

// Studio photo/video uploads go straight from the browser to Blob storage
// (this route only ever hands out a short-lived upload token) — that's what
// lets large iPhone photos and videos get through at all. Server Actions
// route their whole request body through a serverless function, which on
// Vercel is capped around 4.5MB; a client upload never hits that limit.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAuthenticated())) {
          throw new Error('Unauthorized')
        }
        return {
          allowedContentTypes: ['image/*', 'video/*'],
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
