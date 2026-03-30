import type { PresetCategory } from './types'

export const PRESETS: Record<string, PresetCategory> = {
  '도박/스팸': {
    enabled: true,
    keywords: ['도박', '바카라', '카지노', '입금보너스', '텔레그램', '토토', '슬롯', '홀덤'],
  },
  '자기홍보': {
    enabled: true,
    keywords: ['구독', '좋아요', '홍보', 'check my', '내 채널', '제 채널', '팔로우', '유튜브 채널'],
  },
  '성인': {
    enabled: true,
    keywords: ['야동', '성인사이트', '텔레방', '19금', '섹스', '야사', '성인영상'],
  },
  '봇 패턴': {
    enabled: true,
    keywords: ['빠른배송', 'A+++', '강추합니다', '100% 추천', '수익인증', '부업'],
  },
}
