type DateInput = string | Date

function parseDate(value: DateInput): Date {
  // The Neon driver may hand back a Date object or a "YYYY-MM-DD" string.
  const str =
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
  // Treat YYYY-MM-DD as a local date to avoid timezone drift.
  const [y, m, d] = str.slice(0, 10).split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function formatShowDate(start: DateInput, end?: DateInput | null): string {
  const startDate = parseDate(start)
  const opts: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }
  if (!end) {
    return startDate.toLocaleDateString('en-US', opts)
  }
  const endDate = parseDate(end)
  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  if (sameMonth) {
    const month = startDate.toLocaleDateString('en-US', { month: 'long' })
    return `${month} ${startDate.getDate()}–${endDate.getDate()}, ${endDate.getFullYear()}`
  }
  return `${startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${endDate.toLocaleDateString('en-US', opts)}`
}

// Returns a "YYYY-MM-DD" string suitable for <input type="date">.
export function toDateInput(value?: DateInput | null): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

// Prefers an exact date when a piece has one (formatted as "August 12,
// 2026"); falls back to the free-text year field for older pieces that
// only ever had a year.
export function formatPieceDate(createdDate?: DateInput | null, year?: string | null): string {
  if (createdDate) {
    return parseDate(createdDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }
  return year ?? ''
}

export function isUpcoming(start: DateInput, end?: DateInput | null): boolean {
  const ref = end ? parseDate(end) : parseDate(start)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return ref >= today
}
