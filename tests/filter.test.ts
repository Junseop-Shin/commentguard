import { describe, it, expect } from 'vitest'
import { shouldBlock } from '../src/content/filter'
import type { FilterStore } from '../src/shared/types'
import { DEFAULT_STORE, DEFAULT_SETTINGS } from '../src/shared/types'
import { PRESETS } from '../src/shared/presets'

function makeStore(overrides: Partial<FilterStore> = {}): FilterStore {
  return {
    ...DEFAULT_STORE,
    presets: JSON.parse(JSON.stringify(PRESETS)),
    ...overrides,
  }
}

describe('shouldBlock', () => {
  it('disabled 상태면 차단 안함', () => {
    const store = makeStore({ enabled: false })
    expect(shouldBlock('바카라 도박', '', store)).toBeNull()
  })
  it('프리셋 키워드 차단', () => {
    const store = makeStore()
    expect(shouldBlock('바카라 합법 사이트', '', store)).toBe('바카라')
  })
  it('비활성화된 프리셋은 차단 안함', () => {
    const presets = JSON.parse(JSON.stringify(PRESETS))
    presets['도박/스팸'].enabled = false
    const store = makeStore({ presets })
    expect(shouldBlock('바카라', '', store)).toBeNull()
  })
  it('커스텀 키워드 차단', () => {
    const store = makeStore({
      keywords: [{ id: '1', value: '테스트단어', enabled: true, isPreset: false }],
    })
    expect(shouldBlock('이건 테스트단어 입니다', '', store)).toBe('테스트단어')
  })
  it('비활성화된 커스텀 키워드는 무시', () => {
    const store = makeStore({
      keywords: [{ id: '1', value: '테스트단어', enabled: false, isPreset: false }],
    })
    expect(shouldBlock('테스트단어', '', store)).toBeNull()
  })
  it('닉네임 like 필터링', () => {
    const store = makeStore({
      nicknames: [{ id: '1', value: '홍보봇', enabled: true, isPreset: false }],
    })
    expect(shouldBlock('안녕하세요', '진짜홍보봇123', store)).toBe('홍보봇')
  })
  it('정규화 후 키워드 매칭 (바*카*라 → 바카라)', () => {
    const store = makeStore({
      keywords: [{ id: '1', value: '바카라', enabled: true, isPreset: false }],
    })
    expect(shouldBlock('바*카*라 합법', '', store)).toBe('바카라')
  })
  it('봇 점수 임계값 초과 시 차단', () => {
    const store = makeStore()
    const botComment = 'https://youtube.com 구독 좋아요!! 채널 방문'
    expect(shouldBlock(botComment, '', store)).not.toBeNull()
  })
  it('초성 검색으로 차단', () => {
    const store = makeStore({
      keywords: [{ id: '1', value: 'ㄷㅂ', enabled: true, isPreset: false }],
      settings: { ...DEFAULT_SETTINGS, useChosung: true },
    })
    expect(shouldBlock('도박은 나빠요', '', store)).toBe('ㄷㅂ')
  })
})
