// Story booklets (fixed, hand-written series such as Oran's level-1 readers).
// A line is what the child reads; [[key]] is a small picture inside the line,
// the prefix before it stays as text ("הַ[[cat]] בָּא").
import { inlinePicture, pictureSVG, PICTURE_KEYS } from '@/lib/readingPictures'

export type StoryPage = { lines: string[]; scene?: string; image_url?: string | null }
export type StoryBooklet = {
  id: string; series: string; level_number: number; number: number; title_he: string
  cover: { scene?: string; image_url?: string | null }; pages: StoryPage[]; status: string; is_free: boolean
}

const TOKEN = /\[\[([a-z_]+)\]\]/g
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c])

/** a line as HTML: text escaped, picture tokens drawn inline */
export function lineHtml(line: string): string {
  return esc(line).replace(TOKEN, (_m, k) => (PICTURE_KEYS.includes(k) ? inlinePicture(k) : ''))
}

/** the pictures used inside a page's lines (for a placeholder illustration) */
export const pagePictures = (p: StoryPage) => [...new Set(p.lines.flatMap(l => [...l.matchAll(TOKEN)].map(m => m[1])))].filter(k => PICTURE_KEYS.includes(k))

export const pictureBig = (k: string, size = 160) => pictureSVG(k, size, 'color')
