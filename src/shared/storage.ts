import type { FilterStore } from './types'
import { DEFAULT_STORE, DEFAULT_SETTINGS } from './types'
import { PRESETS } from './presets'

const STORAGE_KEY = 'yt-comment-filter'       // settings, keywords, nicknames, presets
const STORAGE_KEY_STATS = 'yt-cf-stats'        // stats isolated so saveStore never clobbers them

export async function loadStore(): Promise<FilterStore> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY, STORAGE_KEY_STATS], (result) => {
      if (chrome.runtime.lastError) {
        console.error('[YT Filter] loadStore error:', chrome.runtime.lastError)
        resolve({ ...DEFAULT_STORE, presets: JSON.parse(JSON.stringify(PRESETS)) })
        return
      }
      const stored = result[STORAGE_KEY]
      // Merge with defaults so new fields (e.g. sortKoreanFirst) appear even on old installs
      const settings: FilterStore = stored
        ? { ...DEFAULT_STORE, ...stored, settings: { ...DEFAULT_SETTINGS, ...stored.settings }, presets: stored.presets ?? JSON.parse(JSON.stringify(PRESETS)) }
        : { ...DEFAULT_STORE, presets: JSON.parse(JSON.stringify(PRESETS)) }
      const stats = result[STORAGE_KEY_STATS] ?? DEFAULT_STORE.stats
      resolve({ ...settings, stats })
    })
  })
}

// saveStore intentionally omits stats — stats live in STORAGE_KEY_STATS to prevent
// the popup overwriting stat increments that arrived while the popup was open.
export async function saveStore(store: FilterStore): Promise<void> {
  const { stats: _stats, ...settingsOnly } = store
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: settingsOnly }, () => {
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

  chrome.storage.local.get(STORAGE_KEY_STATS, (result) => {
    if (chrome.runtime.lastError) return
    const stats = result[STORAGE_KEY_STATS] ?? DEFAULT_STORE.stats
    for (const [kw, count] of Object.entries(toFlush)) {
      stats.total += count
      stats.byKeyword[kw] = (stats.byKeyword[kw] ?? 0) + count
    }
    chrome.storage.local.set({ [STORAGE_KEY_STATS]: stats })
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
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [STORAGE_KEY_STATS]: { total: 0, byKeyword: {}, since: Date.now() } },
      () => { resolve() },
    )
  })
}
