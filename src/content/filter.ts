import { getChoseong } from 'es-hangul'
import { normalize } from './normalizer'
import { isBot } from './bot-detector'
import type { FilterStore } from '../shared/types'

export function shouldBlock(
  text: string,
  nickname: string,
  store: FilterStore,
): string | null {
  if (!store.enabled) return null

  const normalizedText = store.settings.useNormalize ? normalize(text) : text

  // 1. Custom keywords
  for (const item of store.keywords) {
    if (!item.enabled) continue
    if (matchKeyword(normalizedText, item.value, store.settings.useChosung)) {
      return item.value
    }
  }

  // 2. Preset keywords
  for (const category of Object.values(store.presets)) {
    if (!category.enabled) continue
    for (const kw of category.keywords) {
      if (matchKeyword(normalizedText, kw, store.settings.useChosung)) {
        return kw
      }
    }
  }

  // 3. Nickname like filter
  for (const item of store.nicknames) {
    if (!item.enabled) continue
    if (nickname.includes(item.value)) {
      return item.value
    }
  }

  // 4. Bot score
  if (isBot(text, store.settings.botSensitivity)) {
    return '__bot__'
  }

  return null
}

function matchKeyword(text: string, keyword: string, useChosung: boolean): boolean {
  if (text.includes(keyword)) return true
  if (useChosung && isChosungOnly(keyword)) {
    return getChoseong(text).includes(keyword)
  }
  return false
}

function isChosungOnly(str: string): boolean {
  return /^[ㄱ-ㅎ]+$/.test(str)
}
