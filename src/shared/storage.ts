import type { FilterStore } from './types'
import { DEFAULT_STORE } from './types'
import { PRESETS } from './presets'

const STORAGE_KEY = 'yt-comment-filter'

export async function loadStore(): Promise<FilterStore> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.error('[YT Filter] loadStore error:', chrome.runtime.lastError)
        resolve({ ...DEFAULT_STORE, presets: JSON.parse(JSON.stringify(PRESETS)) })
        return
      }
      if (result[STORAGE_KEY]) {
        resolve(result[STORAGE_KEY] as FilterStore)
      } else {
        resolve({ ...DEFAULT_STORE, presets: JSON.parse(JSON.stringify(PRESETS)) })
      }
    })
  })
}

export async function saveStore(store: FilterStore): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: store }, () => {
      if (chrome.runtime.lastError) {
        console.error('[YT Filter] saveStore error:', chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

// Batch stat increments to avoid concurrent get+set races when multiple comments
// are blocked in the same processExisting() scan.
const _statQueue: Record<string, number> = {}
let _flushScheduled = false

function _flushStats(): void {
  _flushScheduled = false
  const toFlush = { ..._statQueue }
  for (const key of Object.keys(_statQueue)) delete _statQueue[key]
  if (Object.keys(toFlush).length === 0) return

  chrome.storage.local.get(STORAGE_KEY, (result) => {
    if (chrome.runtime.lastError) return
    const store: FilterStore = result[STORAGE_KEY] ?? { ...DEFAULT_STORE, presets: JSON.parse(JSON.stringify(PRESETS)) }
    for (const [kw, count] of Object.entries(toFlush)) {
      store.stats.total += count
      store.stats.byKeyword[kw] = (store.stats.byKeyword[kw] ?? 0) + count
    }
    chrome.storage.local.set({ [STORAGE_KEY]: store })
  })
}

export function incrementStat(keyword: string): void {
  _statQueue[keyword] = (_statQueue[keyword] ?? 0) + 1
  if (!_flushScheduled) {
    _flushScheduled = true
    setTimeout(_flushStats, 0)
  }
}

export async function resetStats(): Promise<void> {
  const store = await loadStore()
  store.stats = { total: 0, byKeyword: {}, since: Date.now() }
  await saveStore(store)
}
