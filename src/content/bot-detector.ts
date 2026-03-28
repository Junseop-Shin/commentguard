const URL_RE = /https?:\/\/\S+/i
const DOUBLE_BANG_RE = /!!|！！/
const PROMO_KEYWORDS = ['구독', '좋아요', '수익', '카톡', '텔레', '홍보', '채널', '팔로우', '클릭', '링크']

export function calcBotScore(text: string): number {
  if (!text) return 0
  let score = 0
  if (URL_RE.test(text)) score += 40
  const promoCount = PROMO_KEYWORDS.filter((kw) => text.includes(kw)).length
  if (promoCount >= 2) score += 20
  if (DOUBLE_BANG_RE.test(text)) score += 10
  const specialCount = [...text].filter((ch) => /[^\w가-힣ㄱ-ㅎㅏ-ㅣ\s]/.test(ch)).length
  if (text.length > 0 && specialCount / text.length > 0.3) score += 10
  const words = text.split(/\s+/)
  const wordFreq = new Map<string, number>()
  for (const w of words) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1)
  if ([...wordFreq.values()].some((n) => n >= 3)) score += 10
  const engCount = [...text].filter((ch) => /[a-zA-Z]/.test(ch)).length
  if (text.length > 0 && engCount / text.length > 0.6) score += 10
  return score
}

export function isBot(text: string, threshold: number): boolean {
  return calcBotScore(text) >= threshold
}
