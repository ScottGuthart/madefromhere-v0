import { gps } from 'exifr'

// Reads GPS coordinates straight out of a photo's metadata, entirely in the
// browser — nothing is uploaded anywhere to do this. Works for JPEG and
// HEIC (the format iPhones actually shoot in). Returns null if the photo
// has no GPS data (location services were off, or it's a screenshot/scan)
// rather than throwing — this is a nice-to-have, not a required step.
export async function extractGpsFromFile(file: File): Promise<{ lat: number; lng: number } | null> {
  try {
    const result = await gps(file)
    if (result && Number.isFinite(result.latitude) && Number.isFinite(result.longitude)) {
      return { lat: result.latitude, lng: result.longitude }
    }
  } catch {
    // No GPS data, or a format exifr can't read — just skip silently.
  }
  return null
}
