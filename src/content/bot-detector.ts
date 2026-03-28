const URL_RE = /https?:\/\/\S+/i
const DOUBLE_BANG_RE = /!!|！！/
// High-risk promo keywords — these alone indicate likely spam
const PROMO_KEYWORDS = ['수익', '카톡', '텔레', '홍보', '팔로우', '클릭', '링크']
// Engagement words — common in legitimate comments like "좋아요 누르고 구독했습니다"
// Only scored when combined with high-risk keywords or a URL
const ENGAGEMENT_KEYWORDS = ['구독', '좋아요', '채널']

export function calcBotScore(text: string): number {
  if (!text) return 0
  let score = 0

  const hasUrl = URL_RE.test(text)
  if (hasUrl) score += 40

  const promoCount = PROMO_KEYWORDS.filter((kw) => text.includes(kw)).length
  const hasEngagement = ENGAGEMENT_KEYWORDS.some((kw) => text.includes(kw))

  // Award promo score only when high-risk keywords are involved
  if (promoCount >= 2 || (promoCount >= 1 && hasEngagement)) {
    score += 20
  } else if (hasEngagement && hasUrl) {
    // URL + engagement words alone → smaller boost (still suspicious but not definitive)
    score += 10
  }

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
