import { describe, it, expect } from 'vitest'
import { calcBotScore, isBot } from '../src/content/bot-detector'

describe('calcBotScore', () => {
  it('URL 포함 시 40점 이상', () => {
    expect(calcBotScore('https://youtube.com 구독해주세요')).toBeGreaterThanOrEqual(40)
  })
  it('http URL도 감지', () => {
    expect(calcBotScore('http://bit.ly/xxx 클릭')).toBeGreaterThanOrEqual(40)
  })
  it('고위험 키워드 2개 이상 시 20점 추가', () => {
    // 수익, 카톡 is high-risk — engagement words like 구독/좋아요 are separate
    expect(calcBotScore('수익 카톡으로 연락주세요')).toBeGreaterThanOrEqual(20)
  })
  it('구독/좋아요만으로는 낮은 점수 (정상 댓글 오탐 방지)', () => {
    // Legitimate: "좋아요 누르고 구독했습니다!" should not reach bot threshold
    expect(calcBotScore('좋아요 누르고 구독했습니다!')).toBeLessThan(30)
  })
  it('느낌표 연속 시 10점 추가', () => {
    const base = calcBotScore('좋아요')
    const withBang = calcBotScore('좋아요!!')
    expect(withBang).toBeGreaterThan(base)
  })
  it('동일 단어 3회 반복 시 10점 추가', () => {
    expect(calcBotScore('구독 구독 구독 해주세요')).toBeGreaterThanOrEqual(10)
  })
  it('일반 댓글은 낮은 점수', () => {
    expect(calcBotScore('영상 재밌네요 ㅋㅋ')).toBeLessThan(30)
  })
  it('빈 댓글은 0점', () => {
    expect(calcBotScore('')).toBe(0)
  })
  it('isBot: URL + 고위험 키워드 조합 시 true', () => {
    // URL(40) + 1 high-risk + engagement = 20 + !!(10) + repeat(10) = 80
    expect(isBot('https://youtube.com 수익인증 구독!! 수익 수익', 70)).toBe(true)
  })
  it('isBot: 임계값 미만 시 false', () => {
    expect(isBot('영상 재밌네요', 70)).toBe(false)
  })
})
