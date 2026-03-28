import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadStore, saveStore, resetStats } from '../../shared/storage'
import type { FilterStore } from '../../shared/types'
import { DEFAULT_STORE } from '../../shared/types'
import { PRESETS } from '../../shared/presets'
import { nanoid } from 'nanoid'

export const useFilterStore = defineStore('filters', () => {
  const store = ref<FilterStore>({ ...DEFAULT_STORE, presets: JSON.parse(JSON.stringify(PRESETS)) })
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
    store, loaded, load,
    toggleEnabled, addKeyword, removeKeyword, toggleKeyword,
    addNickname, removeNickname, togglePresetCategory,
    updateSetting, clearStats,
  }
})
