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
          presets: JSON.parse(JSON.stringify(PRESETS)),
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
