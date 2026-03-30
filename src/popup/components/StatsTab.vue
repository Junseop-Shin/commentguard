<template>
  <div class="space-y-4 pb-2">
    <div class="text-center py-3">
      <p class="text-4xl font-bold text-red-500 tabular-nums">{{ fs.store.stats.total.toLocaleString() }}</p>
      <p class="text-xs text-gray-400 mt-1">{{ t('statsTotal') }}</p>
      <p class="text-xs text-gray-300 dark:text-gray-500 mt-0.5">{{ sinceDate }} {{ t('statsSince') }}</p>
    </div>

    <hr class="border-gray-100 dark:border-gray-700" />

    <div class="space-y-3">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ t('statsByKeyword') }}</h3>
      <div v-if="topKeywords.length === 0" class="text-center py-6">
        <p class="text-sm text-gray-400">{{ t('statsEmpty') }}</p>
        <p class="text-xs text-gray-300 dark:text-gray-500 mt-1">{{ t('statsEmptySub') }}</p>
      </div>
      <div v-for="[kw, count] in topKeywords" :key="kw" class="space-y-1">
        <div class="flex justify-between items-baseline text-sm">
          <span class="truncate max-w-[200px]">{{ displayKw(kw) }}</span>
          <span class="text-gray-400 tabular-nums ml-2 shrink-0">{{ count.toLocaleString() }}{{ t('statsCount') }}</span>
        </div>
        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
          <div
            class="bg-red-400 h-1.5 rounded-full transition-all"
            :style="{ width: `${(count / maxCount) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <button
      @click="fs.clearStats()"
      class="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-2 border border-gray-200 dark:border-gray-700 rounded-md hover:border-red-200 dark:hover:border-red-800"
    >
      {{ t('statsReset') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '../store/filters'
import { t } from '../../shared/i18n'
import { BOT_BLOCKED } from '../../shared/types'

const fs = useFilterStore()

const topKeywords = computed(() =>
  Object.entries(fs.store.stats.byKeyword)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10),
)

const maxCount = computed(() =>
  topKeywords.value.length ? topKeywords.value[0][1] : 1,
)

const sinceDate = computed(() =>
  new Date(fs.store.stats.since).toLocaleDateString(),
)

function displayKw(kw: string): string {
  return kw === BOT_BLOCKED ? t('botLabel') : kw
}
</script>
