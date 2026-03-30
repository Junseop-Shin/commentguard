import { describe, it, expect } from 'vitest'
import { normalize } from '../src/content/normalizer'

describe('normalize', () => {
  it('전각 문자를 반각으로 변환', () => {
    expect(normalize('ｂａｋａｒａ')).toBe('bakara')
  })
  it('숫자 1을 ㅣ로 치환', () => {
    expect(normalize('ㅆ1발')).toContain('ㅣ')
  })
  it('파이프를 ㅣ로 치환', () => {
    expect(normalize('ㅅ|발')).toContain('ㅣ')
  })
  it('특수문자 제거', () => {
    expect(normalize('바*카*라')).toBe('바카라')
  })
  it('전각 공백 제거', () => {
    expect(normalize('바　카라')).toBe('바카라')
  })
  it('빈 문자열 처리', () => {
    expect(normalize('')).toBe('')
  })
})
