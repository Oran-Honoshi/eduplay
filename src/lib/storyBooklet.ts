// Story booklets (fixed, hand-written series such as Oran's level-1 readers).
// A line is what the child reads; [[key]] is a small picture inside the line,
// the prefix before it stays as text ("הַ[[cat]] בָּא").
import { inlinePicture, pictureSVG, pictureWord, PICTURE_KEYS } from '@/lib/readingPictures'
import { INLINE_NEW } from '@/data/storyInlinePictures'
import inlineAssets from '@/data/inlineAssets.json'

export type StoryPage = { lines: string[]; scene?: string; image_url?: string | null }
export type StoryBooklet = {
  id: string; series: string; level_number: number; number: number; title_he: string
  cover: { scene?: string; image_url?: string | null; theme?: string | null; parents?: { title?: string | null; text: string[] } | null }; pages: StoryPage[]; status: string; is_free: boolean
}

const TOKEN = /\[\[([a-z_]+)\]\]/g
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c])

/** a line as HTML: text escaped, picture tokens drawn inline */
export function lineHtml(line: string): string {
  // a finished picture file (public/stories/inline/<key>.webp, listed in inlineAssets.json) wins over the code-drawn one
  return esc(line).replace(TOKEN, (_m, k) => ((inlineAssets as Record<string, string>)[k] || !PICTURE_KEYS.includes(k) ? extraPicture(k) : inlinePicture(k)))
}

/** a booklet picture that is not drawn in code: its file, or a dashed box with the word until the file arrives */
function extraPicture(k: string): string {
  const he = INLINE_NEW[k]?.he || pictureWord(k)
  if (!he) return ''
  const file = (inlineAssets as Record<string, string>)[k]
  if (file) return `<img src="${esc(file)}" alt="${esc(he)}" style="display:inline-block;width:1.45em;height:1.45em;object-fit:contain;vertical-align:-0.38em;margin:0 .08em">`
  return `<span title="חסר איור: ${esc(he)}" style="display:inline-flex;align-items:center;justify-content:center;min-width:1.45em;height:1.45em;padding:0 .25em;border:2px dashed #C9B98F;border-radius:.35em;background:#FFF8E6;color:#8A7A55;font:700 .36em/1 'Noto Sans Hebrew',sans-serif;vertical-align:-0.38em;margin:0 .08em;white-space:nowrap">${esc(he)}</span>`
}

/** the pictures used inside a page's lines (for a placeholder illustration) */
export const pagePictures = (p: StoryPage) => [...new Set(p.lines.flatMap(l => [...l.matchAll(TOKEN)].map(m => m[1])))].filter(k => PICTURE_KEYS.includes(k))

export const pictureBig = (k: string, size = 160) => pictureSVG(k, size, 'color')
