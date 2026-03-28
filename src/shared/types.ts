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

export interface FilterSettings {
  useChosung: boolean
  useNormalize: boolean
  botSensitivity: number      // 0~100, default 70
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
