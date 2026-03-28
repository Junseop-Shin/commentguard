<template>
  <button
    @click="$emit('update:modelValue', !modelValue)"
    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
    :class="modelValue ? 'bg-red-500' : 'bg-gray-300'"
    :aria-pressed="modelValue"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
      :class="modelValue ? 'translate-x-4' : 'translate-x-0.5'"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
