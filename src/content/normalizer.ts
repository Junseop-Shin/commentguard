const SUBSTITUTION_MAP: Record<string, string> = {
  '1': 'ㅣ',
  '|': 'ㅣ',
  '0': 'ㅇ',
  '$': 'ㅅ',
  '@': 'ㅇ',
  '*': '',
  '　': '',
}

export function normalize(text: string): string {
  if (!text) return ''
  // First apply NFKC to convert fullwidth chars to halfwidth and compose jamo
  let result = text.normalize('NFKC')
  // Apply substitution map (1→ㅣ, |→ㅣ, *→'', fullwidth space→'', etc.)
  result = result.split('').map((ch) => SUBSTITUTION_MAP[ch] ?? ch).join('')
  // Remove digits (2-9 have no phonetic substitute) and all non-letter special chars.
  // Using [a-zA-Z] instead of \w to exclude digits — otherwise '바2카라' would not
  // match keyword '바카라' because '2' would survive the strip unchanged.
  result = result.replace(/[^a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')
  return result
}

