<template>
  <div class="space-y-4 pb-2">
    <!-- Settings -->
    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">설정</h3>
      <div class="flex items-center justify-between py-0.5">
        <span class="text-sm">초성 검색</span>
        <ToggleSwitch :model-value="fs.store.settings.useChosung" @update:model-value="fs.updateSetting('useChosung', $event)" />
      </div>
      <div class="flex items-center justify-between py-0.5">
        <span class="text-sm">변형문자 정규화</span>
        <ToggleSwitch :model-value="fs.store.settings.useNormalize" @update:model-value="fs.updateSetting('useNormalize', $event)" />
      </div>
      <div class="flex items-center justify-between py-0.5">
        <span class="text-sm">고정 댓글 보호</span>
        <ToggleSwitch :model-value="fs.store.settings.protectPinnedComment" @update:model-value="fs.updateSetting('protectPinnedComment', $event)" />
      </div>
      <div class="space-y-1 pt-1">
        <div class="flex justify-between text-sm">
          <span>봇 감지 민감도</span>
          <span class="text-gray-400 tabular-nums">{{ fs.store.settings.botSensitivity }}/100</span>
        </div>
        <input
          type="range" min="0" max="100" step="5"
          :value="fs.store.settings.botSensitivity"
          @change="fs.updateSetting('botSensitivity', +($event.target as HTMLInputElement).value)"
          class="w-full h-1.5 accent-red-500 cursor-pointer"
        />
        <div class="flex justify-between text-xs text-gray-400">
          <span>← 민감</span><span>관대 →</span>
        </div>
      </div>
    </section>

    <hr class="border-gray-100" />

    <!-- Presets -->
    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">프리셋</h3>
      <div v-for="(cat, name) in fs.store.presets" :key="name" class="flex items-center justify-between py-0.5">
        <span class="text-sm">{{ name }}</span>
        <ToggleSwitch :model-value="cat.enabled" @update:model-value="fs.togglePresetCategory(String(name))" />
      </div>
    </section>

    <hr class="border-gray-100" />

    <!-- Keywords -->
    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">키워드</h3>
      <div class="flex gap-1.5">
        <input
          v-model="newKeyword"
          @keydown.enter="addKw"
          placeholder="키워드 추가..."
          class="flex-1 text-sm border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
        />
        <button @click="addKw" class="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors shrink-0">
          추가
        </button>
      </div>
      <div v-if="fs.store.keywords.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="item in fs.store.keywords"
          :key="item.id"
          class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity"
          :class="item.enabled ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-400'"
        >
          <button @click="fs.toggleKeyword(item.id)" class="hover:opacity-70">{{ item.value }}</button>
          <button @click="fs.removeKeyword(item.id)" class="ml-0.5 hover:text-red-500">×</button>
        </span>
      </div>
      <p v-else class="text-xs text-gray-400">추가된 키워드가 없어요</p>
    </section>

    <!-- Nicknames -->
    <section class="space-y-2">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">닉네임</h3>
      <div class="flex gap-1.5">
        <input
          v-model="newNickname"
          @keydown.enter="addNick"
          placeholder="닉네임 추가..."
          class="flex-1 text-sm border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
        />
        <button @click="addNick" class="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors shrink-0">
          추가
        </button>
      </div>
      <div v-if="fs.store.nicknames.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="item in fs.store.nicknames"
          :key="item.id"
          class="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium"
        >
          {{ item.value }}
          <button @click="fs.removeNickname(item.id)" class="ml-0.5 hover:text-red-500">×</button>
        </span>
      </div>
      <p v-else class="text-xs text-gray-400">추가된 닉네임이 없어요</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFilterStore } from '../store/filters'
import ToggleSwitch from './ToggleSwitch.vue'

const fs = useFilterStore()
const newKeyword = ref('')
const newNickname = ref('')

function addKw() {
  fs.addKeyword(newKeyword.value)
  newKeyword.value = ''
}

function addNick() {
  fs.addNickname(newNickname.value)
  newNickname.value = ''
}
</script>
