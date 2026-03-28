import { getChoseong } from 'es-hangul'
import { normalize } from './normalizer'
import { isBot } from './bot-detector'
import type { FilterStore } from '../shared/types'

export const BOT_BLOCKED = '__bot__'

export function shouldBlock(
  text: string,
  nickname: string,
  store: FilterStore,
): string | null {
  if (!store.enabled) return null

  const normalizedText = store.settings.useNormalize ? normalize(text) : text
  const normalizedNick = store.settings.useNormalize ? normalize(nickname) : nickname

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

  // 3. Nickname like filter (uses normalized nickname)
  for (const item of store.nicknames) {
    if (!item.enabled) continue
    if (normalizedNick.includes(item.value)) {
      return item.value
    }
  }

  // 4. Bot score (uses normalized text)
  if (isBot(normalizedText, store.settings.botSensitivity)) {
    return BOT_BLOCKED
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
