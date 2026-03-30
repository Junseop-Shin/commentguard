<template>
  <div class="space-y-4 pb-2">
    <div class="text-center py-3">
      <p class="text-4xl font-bold text-red-500 tabular-nums">{{ fs.store.stats.total.toLocaleString('ko-KR') }}</p>
      <p class="text-xs text-gray-400 mt-1">총 차단된 댓글</p>
      <p class="text-xs text-gray-300 mt-0.5">{{ sinceDate }} 부터</p>
    </div>

    <hr class="border-gray-100" />

    <div class="space-y-3">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">키워드별 차단</h3>
      <div v-if="topKeywords.length === 0" class="text-center py-6">
        <p class="text-sm text-gray-400">아직 차단된 댓글이 없어요</p>
        <p class="text-xs text-gray-300 mt-1">YouTube 댓글 페이지를 방문해보세요</p>
      </div>
      <div v-for="[kw, count] in topKeywords" :key="kw" class="space-y-1">
        <div class="flex justify-between items-baseline text-sm">
          <span class="truncate max-w-[200px]">{{ displayKw(kw) }}</span>
          <span class="text-gray-400 tabular-nums ml-2 shrink-0">{{ count.toLocaleString('ko-KR') }}회</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-1.5">
          <div
            class="bg-red-400 h-1.5 rounded-full transition-all"
            :style="{ width: `${(count / maxCount) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <button
      @click="fs.clearStats()"
      class="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-2 border border-gray-200 rounded-md hover:border-red-200"
    >
      통계 초기화
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '../store/filters'
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
  new Date(fs.store.stats.since).toLocaleDateString('ko-KR'),
)

function displayKw(kw: string): string {
  return kw === BOT_BLOCKED ? '🤖 봇 감지' : kw
}
</script>
