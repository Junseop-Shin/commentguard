# YT Comment Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** YouTube 댓글 키워드/닉네임/봇 필터링 Chrome Extension (Manifest V3) 구현 및 Chrome Web Store 배포 준비.

**Architecture:** Content Script가 MutationObserver로 YouTube 댓글 DOM을 감지하고, 정규화 파이프라인 → 키워드/닉네임/봇 점수 필터를 거쳐 차단 여부를 결정. 팝업 UI는 Vue 3 + Pinia로 필터 관리 및 로컬 통계를 표시. 모든 데이터는 chrome.storage.local에 저장.

**Tech Stack:** Vite 5, TypeScript, Vue 3, Pinia, Tailwind CSS v3, es-hangul, Vitest (단위 테스트)

---

## File Map

| 파일 | 역할 |
|------|------|
| `manifest.json` | Extension 설정 (MV3) |
| `vite.config.ts` | 멀티 엔트리 빌드 설정 |
| `src/shared/types.ts` | 공유 TypeScript 타입 |
| `src/shared/storage.ts` | chrome.storage.local 래퍼 |
| `src/shared/presets.ts` | 기본 제공 키워드 프리셋 |
| `src/content/normalizer.ts` | NFKC + 치환맵 텍스트 정규화 |
| `src/content/bot-detector.ts` | 점수 기반 봇 감지 |
| `src/content/filter.ts` | 필터링 파이프라인 조합 |
| `src/content/index.ts` | MutationObserver 진입점 |
| `src/popup/main.ts` | Vue 앱 진입점 |
| `src/popup/App.vue` | 팝업 루트 컴포넌트 |
| `src/popup/store/filters.ts` | Pinia 필터 스토어 |
| `src/popup/components/FilterTab.vue` | 키워드/닉네임/봇 관리 탭 |
| `src/popup/components/StatsTab.vue` | 차단 통계 탭 |
| `src/popup/components/ToggleSwitch.vue` | 재사용 토글 컴포넌트 |
| `popup.html` | 팝업 HTML 진입점 |
| `tests/normalizer.test.ts` | 정규화 단위 테스트 |
| `tests/bot-detector.test.ts` | 봇 감지 단위 테스트 |
| `tests/filter.test.ts` | 필터 파이프라인 단위 테스트 |

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `popup.html`

- [ ] **Step 1: 프로젝트 디렉토리 초기화**

```bash
cd /Users/js/Documents/Work/Projects/yt-comment-filter
npm init -y
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install -D vite typescript vue @vitejs/plugin-vue
npm install -D tailwindcss postcss autoprefixer
npm install -D vitest @vitest/coverage-v8
npm install vue pinia es-hangul
```

- [ ] **Step 3: TypeScript 설정 작성**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "lib": ["ES2020", "DOM"],
    "types": ["chrome"],
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: chrome 타입 설치**

```bash
npm install -D @types/chrome
```

- [ ] **Step 5: Tailwind 초기화**

```bash
npx tailwindcss init -p
```

`tailwind.config.js` 내용 교체:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./popup.html', './src/popup/**/*.{vue,ts}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 6: Vite 설정 작성**

Create `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@shared': resolve(__dirname, 'src/shared') },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 7: popup.html 작성**

Create `popup.html`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YT 댓글 필터</title>
  <style>body { width: 360px; min-height: 480px; margin: 0; }</style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/popup/main.ts"></script>
</body>
</html>
```

- [ ] **Step 8: package.json scripts 업데이트**

`package.json`의 scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 9: 디렉토리 구조 생성**

```bash
mkdir -p src/content src/popup/components src/popup/store src/shared tests public/icons
```

- [ ] **Step 10: 빌드 확인 (아직 소스 없으므로 에러 무시)**

```bash
npm run build 2>&1 | head -20
```

---

## Task 2: 공유 타입 정의

**Files:**
- Create: `src/shared/types.ts`

- [ ] **Step 1: 타입 파일 작성**

Create `src/shared/types.ts`:
```ts
export interface FilterItem {
  id: string
  value: string
  enabled: boolean
  isPreset: boolean
}

export interface PresetCategory {
  enabled: boolean
  keywords: string[]
}

export interface BotRule {
  id: string
  label: string
  score: number
  enabled: boolean
}

export interface FilterSettings {
  useChosung: boolean
  useNormalize: boolean
  botSensitivity: number      // 0~100, 기본 70
  protectPinnedComment: boolean
  showBlockedComments: boolean
}

export interface FilterStats {
  total: number
  byKeyword: Record<string, number>
  since: number
}

export interface FilterStore {
  enabled: boolean
  keywords: FilterItem[]
  nicknames: FilterItem[]
  presets: Record<string, PresetCategory>
  settings: FilterSettings
  stats: FilterStats
}

export const DEFAULT_SETTINGS: FilterSettings = {
  useChosung: true,
  useNormalize: true,
  botSensitivity: 70,
  protectPinnedComment: true,
  showBlockedComments: false,
}

export const DEFAULT_STORE: FilterStore = {
  enabled: true,
  keywords: [],
  nicknames: [],
  presets: {},
  settings: DEFAULT_SETTINGS,
  stats: { total: 0, byKeyword: {}, since: Date.now() },
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/shared/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: 프리셋 키워드

**Files:**
- Create: `src/shared/presets.ts`

- [ ] **Step 1: 프리셋 파일 작성**

Create `src/shared/presets.ts`:
```ts
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/shared/presets.ts
git commit -m "feat: add preset keyword categories"
```

---

## Task 4: chrome.storage 래퍼

**Files:**
- Create: `src/shared/storage.ts`

- [ ] **Step 1: storage 래퍼 작성**

Create `src/shared/storage.ts`:
```ts
import type { FilterStore } from './types'
import { DEFAULT_STORE } from './types'
import { PRESETS } from './presets'

const STORAGE_KEY = 'yt-comment-filter'

export async function loadStore(): Promise<FilterStore> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]) {
        resolve(result[STORAGE_KEY] as FilterStore)
      } else {
        const initial: FilterStore = {
          ...DEFAULT_STORE,
          presets: { ...PRESETS },
        }
        resolve(initial)
      }
    })
  })
}

export async function saveStore(store: FilterStore): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: store }, resolve)
  })
}

export async function incrementStat(keyword: string): Promise<void> {
  const store = await loadStore()
  store.stats.total += 1
  store.stats.byKeyword[keyword] = (store.stats.byKeyword[keyword] ?? 0) + 1
  await saveStore(store)
}

export async function resetStats(): Promise<void> {
  const store = await loadStore()
  store.stats = { total: 0, byKeyword: {}, since: Date.now() }
  await saveStore(store)
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/shared/storage.ts
git commit -m "feat: add chrome.storage wrapper with stat tracking"
```

---

## Task 5: 텍스트 정규화 (TDD)

**Files:**
- Create: `src/content/normalizer.ts`
- Create: `tests/normalizer.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/normalizer.test.ts`:
```ts
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

  it('$를 ㅅ으로 치환', () => {
    expect(normalize('$1발')).toContain('ㅅ')
  })

  it('빈 문자열 처리', () => {
    expect(normalize('')).toBe('')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test 2>&1 | grep -E "FAIL|PASS|Error"
```
Expected: FAIL (normalizer not found)

- [ ] **Step 3: normalizer 구현**

Create `src/content/normalizer.ts`:
```ts
const SUBSTITUTION_MAP: Record<string, string> = {
  '1': 'ㅣ',
  '|': 'ㅣ',
  'l': 'ㅣ',
  '0': 'ㅇ',
  '$': 'ㅅ',
  '@': 'ㅇ',
  '!': '',
  '*': '',
  '.': '',
  '-': '',
  '_': '',
  '　': '', // 전각 공백
}

const SPECIAL_CHARS_RE = /[^\w가-힣ㄱ-ㅎㅏ-ㅣ\s]/g

export function normalize(text: string): string {
  if (!text) return ''

  // 1. NFKC: 전각 → 반각
  let result = text.normalize('NFKC')

  // 2. 치환맵 적용
  result = result
    .split('')
    .map((ch) => SUBSTITUTION_MAP[ch] ?? ch)
    .join('')

  // 3. 나머지 특수문자 제거
  result = result.replace(SPECIAL_CHARS_RE, '')

  return result.trim()
}

/** 원본 보존 + 정규화 버전 둘 다 반환 */
export function normalizePair(text: string): { original: string; normalized: string } {
  return { original: text, normalized: normalize(text) }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test tests/normalizer.test.ts
```
Expected: 7 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add src/content/normalizer.ts tests/normalizer.test.ts
git commit -m "feat: add text normalizer with NFKC and substitution map"
```

---

## Task 6: 봇 감지 (TDD)

**Files:**
- Create: `src/content/bot-detector.ts`
- Create: `tests/bot-detector.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/bot-detector.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calcBotScore } from '../src/content/bot-detector'

describe('calcBotScore', () => {
  it('URL 포함 시 40점 이상', () => {
    expect(calcBotScore('https://youtube.com 구독해주세요')).toBeGreaterThanOrEqual(40)
  })

  it('http URL도 감지', () => {
    expect(calcBotScore('http://bit.ly/xxx 클릭')).toBeGreaterThanOrEqual(40)
  })

  it('홍보 키워드 다수 포함 시 20점 이상', () => {
    expect(calcBotScore('구독 좋아요 수익 카톡으로 오세요')).toBeGreaterThanOrEqual(20)
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
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test tests/bot-detector.test.ts 2>&1 | grep -E "FAIL|Error"
```
Expected: FAIL

- [ ] **Step 3: 봇 감지 구현**

Create `src/content/bot-detector.ts`:
```ts
const URL_RE = /https?:\/\/\S+/i
const DOUBLE_BANG_RE = /!!|！！/
const PROMO_KEYWORDS = ['구독', '좋아요', '수익', '카톡', '텔레', '홍보', '채널', '팔로우', '클릭', '링크']

export function calcBotScore(text: string): number {
  if (!text) return 0

  let score = 0

  // URL 포함 +40
  if (URL_RE.test(text)) score += 40

  // 홍보 키워드 2개 이상 +20
  const promoCount = PROMO_KEYWORDS.filter((kw) => text.includes(kw)).length
  if (promoCount >= 2) score += 20

  // 느낌표 연속 +10
  if (DOUBLE_BANG_RE.test(text)) score += 10

  // 특수문자 밀도 > 30% +10
  const specialCount = [...text].filter((ch) => /[^\w가-힣ㄱ-ㅎㅏ-ㅣ\s]/.test(ch)).length
  if (text.length > 0 && specialCount / text.length > 0.3) score += 10

  // 동일 단어 3회 이상 반복 +10
  const words = text.split(/\s+/)
  const wordFreq = new Map<string, number>()
  for (const w of words) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1)
  if ([...wordFreq.values()].some((n) => n >= 3)) score += 10

  // 영문 비율 > 60% +10
  const engCount = [...text].filter((ch) => /[a-zA-Z]/.test(ch)).length
  if (text.length > 0 && engCount / text.length > 0.6) score += 10

  return score
}

export function isBot(text: string, threshold: number): boolean {
  return calcBotScore(text) >= threshold
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test tests/bot-detector.test.ts
```
Expected: 7 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add src/content/bot-detector.ts tests/bot-detector.test.ts
git commit -m "feat: add score-based bot detector"
```

---

## Task 7: 필터 파이프라인 (TDD)

**Files:**
- Create: `src/content/filter.ts`
- Create: `tests/filter.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/filter.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { shouldBlock } from '../src/content/filter'
import type { FilterStore } from '../src/shared/types'
import { DEFAULT_STORE, DEFAULT_SETTINGS } from '../src/shared/types'
import { PRESETS } from '../src/shared/presets'

function makeStore(overrides: Partial<FilterStore> = {}): FilterStore {
  return {
    ...DEFAULT_STORE,
    presets: { ...PRESETS },
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
    const store = makeStore({
      presets: { ...PRESETS, '도박/스팸': { enabled: false, keywords: PRESETS['도박/스팸'].keywords } },
    })
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

  it('정규화 후 키워드 매칭', () => {
    const store = makeStore({
      keywords: [{ id: '1', value: '바카라', enabled: true, isPreset: false }],
    })
    // 바*카*라 → 바카라 정규화 후 매칭
    expect(shouldBlock('바*카*라 합법', '', store)).toBe('바카라')
  })

  it('봇 점수 임계값 초과 시 차단', () => {
    const store = makeStore()
    // URL 포함(40) + 홍보키워드 2개(20) = 60점 → 기본 70점 미만이므로 통과
    // URL + 홍보키워드 + 느낌표 = 70점 → 차단
    const botComment = 'https://youtube.com 구독 좋아요!! 채널 방문'
    const result = shouldBlock(botComment, '', store)
    expect(result).not.toBeNull()
  })

  it('초성 검색으로 차단', () => {
    const store = makeStore({
      keywords: [{ id: '1', value: 'ㄷㅂ', enabled: true, isPreset: false }],
      settings: { ...DEFAULT_SETTINGS, useChosung: true },
    })
    expect(shouldBlock('도박은 나빠요', '', store)).toBe('ㄳ')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test tests/filter.test.ts 2>&1 | grep -E "FAIL|Error" | head -5
```
Expected: FAIL

- [ ] **Step 3: 필터 파이프라인 구현**

Create `src/content/filter.ts`:
```ts
import { chosungIncludes } from 'es-hangul'
import { normalize } from './normalizer'
import { isBot } from './bot-detector'
import type { FilterStore } from '@shared/types'

/**
 * 댓글 텍스트/닉네임을 필터 스토어 기준으로 검사.
 * @returns 차단 원인 키워드 문자열 | null (통과)
 */
export function shouldBlock(
  text: string,
  nickname: string,
  store: FilterStore,
): string | null {
  if (!store.enabled) return null

  const normalizedText = store.settings.useNormalize ? normalize(text) : text

  // 1. 커스텀 키워드
  for (const item of store.keywords) {
    if (!item.enabled) continue
    if (matchKeyword(normalizedText, item.value, store.settings.useChosung)) {
      return item.value
    }
  }

  // 2. 프리셋 키워드
  for (const [, category] of Object.entries(store.presets)) {
    if (!category.enabled) continue
    for (const kw of category.keywords) {
      if (matchKeyword(normalizedText, kw, store.settings.useChosung)) {
        return kw
      }
    }
  }

  // 3. 닉네임 like 필터
  for (const item of store.nicknames) {
    if (!item.enabled) continue
    if (nickname.includes(item.value)) {
      return item.value
    }
  }

  // 4. 봇 점수
  if (isBot(text, store.settings.botSensitivity)) {
    return '__bot__'
  }

  return null
}

function matchKeyword(text: string, keyword: string, useChosung: boolean): boolean {
  if (text.includes(keyword)) return true
  if (useChosung && isChosungOnly(keyword)) {
    return chosungIncludes(text, keyword)
  }
  return false
}

function isChosungOnly(str: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(str)
}
```

- [ ] **Step 4: 테스트 수정 (초성 테스트 기대값 수정)**

`tests/filter.test.ts`의 마지막 테스트 기대값 수정:
```ts
  it('초성 검색으로 차단', () => {
    const store = makeStore({
      keywords: [{ id: '1', value: 'ㄷㅂ', enabled: true, isPreset: false }],
      settings: { ...DEFAULT_SETTINGS, useChosung: true },
    })
    expect(shouldBlock('도박은 나빠요', '', store)).toBe('ㄷㅂ')
  })
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npm test tests/filter.test.ts
```
Expected: 8 tests PASS (초성 테스트 포함)

- [ ] **Step 6: 커밋**

```bash
git add src/content/filter.ts tests/filter.test.ts
git commit -m "feat: add filter pipeline with keyword/nickname/bot detection"
```

---

## Task 8: Content Script (MutationObserver)

**Files:**
- Create: `src/content/index.ts`

- [ ] **Step 1: Content script 작성**

Create `src/content/index.ts`:
```ts
import { shouldBlock } from './filter'
import { loadStore, incrementStat } from '@shared/storage'
import type { FilterStore } from '@shared/types'

const COMMENT_SELECTOR = 'ytd-comment-view-model, ytd-comment-renderer'
const PINNED_BADGE_SELECTOR = '#pinned-comment-badge, ytd-pinned-comment-badge-renderer'

let store: FilterStore | null = null

async function init() {
  store = await loadStore()
  processExisting()
  observeComments()

  // storage 변경 시 실시간 반영
  chrome.storage.onChanged.addListener(async () => {
    store = await loadStore()
  })
}

function processExisting() {
  document.querySelectorAll<HTMLElement>(COMMENT_SELECTOR).forEach(processComment)
}

function observeComments() {
  const observer = new MutationObserver((mutations) => {
    requestIdleCallback(() => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.matches(COMMENT_SELECTOR)) {
              processComment(node)
            } else {
              node.querySelectorAll<HTMLElement>(COMMENT_SELECTOR).forEach(processComment)
            }
          }
        }
      }
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

function processComment(el: HTMLElement) {
  if (!store) return

  // 고정 댓글 보호
  if (store.settings.protectPinnedComment && el.querySelector(PINNED_BADGE_SELECTOR)) {
    return
  }

  const text = el.querySelector('#content-text')?.textContent ?? ''
  const nickname = el.querySelector('#author-text')?.textContent?.trim() ?? ''

  const blockedBy = shouldBlock(text, nickname, store)

  if (blockedBy) {
    el.style.display = 'none'
    el.dataset.blockedBy = blockedBy
    incrementStat(blockedBy)
  }
}

init()
```

- [ ] **Step 2: 커밋**

```bash
git add src/content/index.ts
git commit -m "feat: add content script with MutationObserver"
```

---

## Task 9: Pinia 스토어 (팝업)

**Files:**
- Create: `src/popup/store/filters.ts`

- [ ] **Step 1: Pinia 스토어 작성**

Create `src/popup/store/filters.ts`:
```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadStore, saveStore, resetStats } from '@shared/storage'
import type { FilterStore, FilterItem } from '@shared/types'
import { DEFAULT_STORE } from '@shared/types'
import { PRESETS } from '@shared/presets'
import { nanoid } from 'nanoid'

export const useFilterStore = defineStore('filters', () => {
  const store = ref<FilterStore>({ ...DEFAULT_STORE, presets: { ...PRESETS } })
  const loaded = ref(false)

  async function load() {
    store.value = await loadStore()
    loaded.value = true
  }

  async function save() {
    await saveStore(store.value)
  }

  async function toggleEnabled() {
    store.value.enabled = !store.value.enabled
    await save()
  }

  async function addKeyword(value: string) {
    if (!value.trim()) return
    store.value.keywords.push({ id: nanoid(), value: value.trim(), enabled: true, isPreset: false })
    await save()
  }

  async function removeKeyword(id: string) {
    store.value.keywords = store.value.keywords.filter((k) => k.id !== id)
    await save()
  }

  async function toggleKeyword(id: string) {
    const item = store.value.keywords.find((k) => k.id === id)
    if (item) { item.enabled = !item.enabled; await save() }
  }

  async function addNickname(value: string) {
    if (!value.trim()) return
    store.value.nicknames.push({ id: nanoid(), value: value.trim(), enabled: true, isPreset: false })
    await save()
  }

  async function removeNickname(id: string) {
    store.value.nicknames = store.value.nicknames.filter((n) => n.id !== id)
    await save()
  }

  async function togglePresetCategory(category: string) {
    if (store.value.presets[category]) {
      store.value.presets[category].enabled = !store.value.presets[category].enabled
      await save()
    }
  }

  async function updateSetting<K extends keyof FilterStore['settings']>(
    key: K,
    value: FilterStore['settings'][K],
  ) {
    store.value.settings[key] = value
    await save()
  }

  async function clearStats() {
    await resetStats()
    store.value.stats = { total: 0, byKeyword: {}, since: Date.now() }
  }

  return {
    store,
    loaded,
    load,
    toggleEnabled,
    addKeyword,
    removeKeyword,
    toggleKeyword,
    addNickname,
    removeNickname,
    togglePresetCategory,
    updateSetting,
    clearStats,
  }
})
```

- [ ] **Step 2: nanoid 설치**

```bash
npm install nanoid
```

- [ ] **Step 3: 커밋**

```bash
git add src/popup/store/filters.ts
git commit -m "feat: add Pinia store for filter management"
```

---

## Task 10: 팝업 Vue 컴포넌트

**Files:**
- Create: `src/popup/components/ToggleSwitch.vue`
- Create: `src/popup/components/FilterTab.vue`
- Create: `src/popup/components/StatsTab.vue`
- Create: `src/popup/App.vue`
- Create: `src/popup/main.ts`

- [ ] **Step 1: ToggleSwitch 컴포넌트**

Create `src/popup/components/ToggleSwitch.vue`:
```vue
<template>
  <button
    @click="$emit('update:modelValue', !modelValue)"
    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
    :class="modelValue ? 'bg-red-500' : 'bg-gray-300'"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
      :class="modelValue ? 'translate-x-5' : 'translate-x-1'"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
```

- [ ] **Step 2: FilterTab 컴포넌트**

Create `src/popup/components/FilterTab.vue`:
```vue
<template>
  <div class="space-y-4">
    <!-- 설정 -->
    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">설정</h3>
      <div class="flex items-center justify-between">
        <span class="text-sm">초성 검색</span>
        <ToggleSwitch
          :model-value="fs.store.settings.useChosung"
          @update:model-value="fs.updateSetting('useChosung', $event)"
        />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm">변형문자 정규화</span>
        <ToggleSwitch
          :model-value="fs.store.settings.useNormalize"
          @update:model-value="fs.updateSetting('useNormalize', $event)"
        />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm">고정 댓글 보호</span>
        <ToggleSwitch
          :model-value="fs.store.settings.protectPinnedComment"
          @update:model-value="fs.updateSetting('protectPinnedComment', $event)"
        />
      </div>
      <div class="space-y-1">
        <div class="flex justify-between text-sm">
          <span>봇 감지 민감도</span>
          <span class="text-gray-500">{{ fs.store.settings.botSensitivity }}/100</span>
        </div>
        <input
          type="range" min="0" max="100" step="5"
          :value="fs.store.settings.botSensitivity"
          @change="fs.updateSetting('botSensitivity', +($event.target as HTMLInputElement).value)"
          class="w-full accent-red-500"
        />
        <div class="flex justify-between text-xs text-gray-400">
          <span>민감</span><span>관대</span>
        </div>
      </div>
    </section>

    <hr class="border-gray-100" />

    <!-- 프리셋 -->
    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">프리셋</h3>
      <div
        v-for="(cat, name) in fs.store.presets"
        :key="name"
        class="flex items-center justify-between"
      >
        <span class="text-sm">{{ name }}</span>
        <ToggleSwitch
          :model-value="cat.enabled"
          @update:model-value="fs.togglePresetCategory(name)"
        />
      </div>
    </section>

    <hr class="border-gray-100" />

    <!-- 키워드 -->
    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">키워드</h3>
      <div class="flex gap-2">
        <input
          v-model="newKeyword"
          @keydown.enter="addKw"
          placeholder="키워드 추가..."
          class="flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-red-400"
        />
        <button @click="addKw" class="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
          추가
        </button>
      </div>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="item in fs.store.keywords"
          :key="item.id"
          class="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5 text-xs"
          :class="item.enabled ? '' : 'opacity-40'"
        >
          <button @click="fs.toggleKeyword(item.id)">{{ item.value }}</button>
          <button @click="fs.removeKeyword(item.id)" class="text-gray-400 hover:text-red-500">×</button>
        </span>
      </div>
    </section>

    <!-- 닉네임 -->
    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">닉네임</h3>
      <div class="flex gap-2">
        <input
          v-model="newNickname"
          @keydown.enter="addNick"
          placeholder="닉네임 추가..."
          class="flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-red-400"
        />
        <button @click="addNick" class="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
          추가
        </button>
      </div>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="item in fs.store.nicknames"
          :key="item.id"
          class="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5 text-xs"
        >
          {{ item.value }}
          <button @click="fs.removeNickname(item.id)" class="text-gray-400 hover:text-red-500">×</button>
        </span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFilterStore } from '../store/filters'
import ToggleSwitch from './ToggleSwitch.vue'

const fs = useFilterStore()
const newKeyword = ref('')
const newNickname = ref('')

function addKw() {
  fs.addKeyword(newKeyword.value)
  newKeyword.value = ''
}

function addNick() {
  fs.addNickname(newNickname.value)
  newNickname.value = ''
}
</script>
```

- [ ] **Step 3: StatsTab 컴포넌트**

Create `src/popup/components/StatsTab.vue`:
```vue
<template>
  <div class="space-y-4">
    <div class="text-center py-2">
      <p class="text-3xl font-bold text-red-500">{{ fs.store.stats.total.toLocaleString() }}</p>
      <p class="text-xs text-gray-400">총 차단된 댓글</p>
      <p class="text-xs text-gray-400 mt-1">{{ sinceDate }} 부터</p>
    </div>

    <hr class="border-gray-100" />

    <div class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">키워드별 차단</h3>
      <div v-if="topKeywords.length === 0" class="text-sm text-gray-400 text-center py-4">
        아직 차단된 댓글이 없어요
      </div>
      <div v-for="[kw, count] in topKeywords" :key="kw" class="space-y-0.5">
        <div class="flex justify-between text-sm">
          <span class="truncate">{{ kw === '__bot__' ? '🤖 봇 감지' : kw }}</span>
          <span class="text-gray-500 ml-2">{{ count.toLocaleString() }}회</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-1.5">
          <div
            class="bg-red-400 h-1.5 rounded-full"
            :style="{ width: `${(count / maxCount) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <button
      @click="fs.clearStats()"
      class="w-full text-sm text-gray-400 hover:text-red-500 py-1"
    >
      통계 초기화
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '../store/filters'

const fs = useFilterStore()

const topKeywords = computed(() =>
  Object.entries(fs.store.stats.byKeyword)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10),
)

const maxCount = computed(() =>
  topKeywords.value.length ? topKeywords.value[0][1] : 1,
)

const sinceDate = computed(() =>
  new Date(fs.store.stats.since).toLocaleDateString('ko-KR'),
)
</script>
```

- [ ] **Step 4: App.vue 작성**

Create `src/popup/App.vue`:
```vue
<template>
  <div class="p-3 font-sans text-gray-800 select-none">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-base font-bold">YT 댓글 필터</span>
        <span class="text-xs text-gray-400">v1.0</span>
      </div>
      <ToggleSwitch
        :model-value="fs.store.enabled"
        @update:model-value="fs.toggleEnabled()"
      />
    </div>

    <!-- 탭 -->
    <div class="flex border-b border-gray-200 mb-3">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-3 py-1.5 text-sm font-medium border-b-2 transition-colors"
        :class="activeTab === tab.id
          ? 'border-red-500 text-red-500'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 컨텐츠 -->
    <div v-if="fs.loaded" class="overflow-y-auto max-h-96">
      <FilterTab v-if="activeTab === 'filter'" />
      <StatsTab v-else-if="activeTab === 'stats'" />
    </div>
    <div v-else class="flex justify-center py-8">
      <span class="text-gray-400 text-sm">불러오는 중...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFilterStore } from './store/filters'
import ToggleSwitch from './components/ToggleSwitch.vue'
import FilterTab from './components/FilterTab.vue'
import StatsTab from './components/StatsTab.vue'

const fs = useFilterStore()
const activeTab = ref('filter')
const tabs = [
  { id: 'filter', label: '필터' },
  { id: 'stats', label: '통계' },
]

onMounted(() => fs.load())
</script>
```

- [ ] **Step 5: main.ts 작성**

Create `src/popup/main.ts`:
```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

createApp(App).use(createPinia()).mount('#app')
```

- [ ] **Step 6: Tailwind CSS 진입점 생성**

Create `src/popup/style.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: 커밋**

```bash
git add src/popup/
git commit -m "feat: add Vue 3 popup UI with filter and stats tabs"
```

---

## Task 11: Manifest 및 최종 빌드

**Files:**
- Create: `manifest.json`
- Create: `public/icons/icon16.png`, `icon48.png`, `icon128.png` (placeholder)

- [ ] **Step 1: manifest.json 작성**

Create `manifest.json`:
```json
{
  "manifest_version": 3,
  "name": "YT 댓글 필터",
  "version": "1.0.0",
  "description": "YouTube 댓글을 키워드, 닉네임, 봇 패턴으로 필터링합니다. 한글 초성 검색 지원.",
  "permissions": ["storage"],
  "host_permissions": ["https://www.youtube.com/*"],
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 2: vite.config.ts에 manifest 복사 설정 추가**

`vite.config.ts` 수정:
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-manifest',
      closeBundle() {
        copyFileSync('manifest.json', 'dist/manifest.json')
      },
    },
  ],
  resolve: {
    alias: { '@shared': resolve(__dirname, 'src/shared') },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 3: 전체 테스트 실행**

```bash
npm test
```
Expected: 모든 테스트 PASS

- [ ] **Step 4: 빌드 실행**

```bash
npm run build
```
Expected: `dist/` 디렉토리에 popup.html, content.js, popup.js 생성

- [ ] **Step 5: dist 구조 확인**

```bash
ls dist/
```
Expected:
```
assets/  content.js  manifest.json  popup.html  popup.js
```

- [ ] **Step 6: 최종 커밋**

```bash
git add manifest.json vite.config.ts
git commit -m "feat: add manifest.json and finalize build config"
```

---

## ⚠️ 사용자 조치 필요 (마지막에 처리)

1. **아이콘 제작** — `public/icons/` 에 icon16.png, icon48.png, icon128.png 필요. Figma/Canva 등으로 제작 후 추가.
2. **Chrome Web Store 개발자 등록** — $5 일회성 결제 필요. [등록 링크](https://chrome.google.com/webstore/devconsole)
3. **실제 YouTube에서 동작 테스트** — Chrome `chrome://extensions/` → "압축 해제된 확장 프로그램 로드" → `dist/` 폴더 선택
4. **봇 감지 점수 튜닝** — 실사용 후 과필터링/미필터링 피드백 보고 `bot-detector.ts` 점수 조정
