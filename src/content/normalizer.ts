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
  // Remove all whitespace and remaining non-Korean, non-alphanumeric special chars
  result = result.replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ]/g, '')
  return result
}

