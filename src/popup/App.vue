<template>
  <div class="flex-1 flex flex-col p-3 font-sans text-gray-800 dark:text-gray-100 select-none bg-white dark:bg-gray-900 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold tracking-tight">{{ t('appName') }}</span>
        <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-mono">v1.0</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">{{ fs.store.enabled ? t('filterOn') : t('filterOff') }}</span>
        <ToggleSwitch :model-value="fs.store.enabled" @update:model-value="fs.toggleEnabled()" />
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 mb-3">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab.id
          ? 'border-red-500 text-red-500'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div v-if="fs.loaded" class="flex-1 overflow-y-auto pr-0.5">
      <FilterTab v-if="activeTab === 'filter'" />
      <StatsTab v-else-if="activeTab === 'stats'" />
    </div>
    <div v-else class="flex justify-center items-center py-10">
      <span class="text-gray-400 text-sm animate-pulse">{{ t('filterOn') }}...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFilterStore } from './store/filters'
import { t } from '../shared/i18n'
import ToggleSwitch from './components/ToggleSwitch.vue'
import FilterTab from './components/FilterTab.vue'
import StatsTab from './components/StatsTab.vue'

const fs = useFilterStore()
const activeTab = ref<'filter' | 'stats'>('filter')
const tabs = [
  { id: 'filter' as const, label: t('tabFilter') },
  { id: 'stats'  as const, label: t('tabStats') },
]

import { onMounted } from 'vue'
onMounted(() => fs.load())
</script>
