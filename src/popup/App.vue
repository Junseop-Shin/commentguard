<template>
  <div class="p-3 font-sans text-gray-800 select-none bg-white">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold tracking-tight">YT 댓글 필터</span>
        <span class="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">v1.0</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400">{{ fs.store.enabled ? '필터 ON' : '필터 OFF' }}</span>
        <ToggleSwitch :model-value="fs.store.enabled" @update:model-value="fs.toggleEnabled()" />
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 mb-3">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab.id
          ? 'border-red-500 text-red-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div v-if="fs.loaded" class="overflow-y-auto max-h-[400px] pr-0.5">
      <FilterTab v-if="activeTab === 'filter'" />
      <StatsTab v-else-if="activeTab === 'stats'" />
    </div>
    <div v-else class="flex justify-center items-center py-10">
      <span class="text-gray-400 text-sm animate-pulse">불러오는 중...</span>
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
const activeTab = ref<'filter' | 'stats'>('filter')
const tabs = [
  { id: 'filter' as const, label: '필터' },
  { id: 'stats' as const, label: '통계' },
]

onMounted(() => fs.load())
</script>
