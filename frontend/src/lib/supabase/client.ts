import { createBrowserClient } from '@supabase/ssr'

/**
 * Strip any characters with code point > 255 (includes BOM U+FEFF and other
 * Unicode that is not Latin-1). Defends against Vercel env vars accidentally
 * pasted with an invisible BOM or Unicode prefix, which causes the browser
 * Fetch API to throw "String contains non ISO-8859-1 code point" when the
 * value is used in an HTTP request header (apikey / Authorization).
 */
function sanitize(val: string | undefined): string {
  return Array.from(val ?? '')
    .filter((ch) => (ch.codePointAt(0) ?? 0) <= 255)
    .join('')
    .trim()
}

export function createClient() {
  return createBrowserClient(
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL),
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}
