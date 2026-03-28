import { getChoseong } from 'es-hangul'
import { normalize } from './normalizer'
import { isBot } from './bot-detector'
import type { FilterStore } from '../shared/types'
import { BOT_BLOCKED } from '../shared/types'

export { BOT_BLOCKED }

// Cache: flattened active preset keywords keyed by normalized form → original value.
// Rebuilt when the store reference changes (store reload after settings update).
let _cachedStore: FilterStore | null = null
let _presetCache: Array<{ normalized: string; original: string }> = []

function buildPresetCache(store: FilterStore): void {
  _presetCache = []
  for (const category of Object.values(store.presets)) {
    if (!category.enabled) continue
    for (const kw of category.keywords) {
      _presetCache.push({ normalized: normalize(kw), original: kw })
    }
  }
}

export function shouldBlock(
  text: string,
  nickname: string,
  store: FilterStore,
): string | null {
  if (!store.enabled) return null

  // Rebuild preset cache when store changes (reference equality check)
  if (store !== _cachedStore) {
    buildPresetCache(store)
    _cachedStore = store
  }

  const normalizedText = store.settings.useNormalize ? normalize(text) : text
  const normalizedNick = store.settings.useNormalize ? normalize(nickname) : nickname

  // 1. Custom keywords
  for (const item of store.keywords) {
    if (!item.enabled) continue
    if (matchKeyword(normalizedText, item.value, store.settings.useChosung)) {
      return item.value
    }
  }

  // 2. Preset keywords (cached flat list)
  for (const { normalized, original } of _presetCache) {
    if (normalizedText.includes(normalized)) return original
    if (store.settings.useChosung && isChosungOnly(original)) {
      if (getChoseong(normalizedText).includes(original)) return original
    }
  }

  // 3. Nickname like filter
  for (const item of store.nicknames) {
    if (!item.enabled) continue
    const normalizedItemValue = store.settings.useNormalize ? normalize(item.value) : item.value
    if (normalizedNick.includes(normalizedItemValue)) {
      return item.value // return original value for display
    }
  }

  // 4. Bot score — use raw text so URL regex works
  if (isBot(text, store.settings.botSensitivity)) {
    return BOT_BLOCKED
  }

  return null
}

function matchKeyword(text: string, keyword: string, useChosung: boolean): boolean {
  // Normalize keyword to match how text was normalized (strips spaces/special chars)
  const normalizedKeyword = normalize(keyword)
  if (text.includes(normalizedKeyword)) return true
  if (useChosung && isChosungOnly(keyword)) {
    return getChoseong(text).includes(keyword)
  }
  return false
}

function isChosungOnly(str: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(str)
}
