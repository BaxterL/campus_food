<template>
  <image
    v-if="src"
    class="thumb"
    :class="sizeClass"
    :src="src"
    mode="aspectFill"
  />
  <view v-else class="thumb placeholder" :class="sizeClass">
    <text class="emoji">{{ emoji }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveMediaUrl } from '@/utils/format';

const props = withDefaults(
  defineProps<{
    url?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { size: 'md' },
);

const src = computed(() => resolveMediaUrl(props.url));
const sizeClass = computed(() => `size-${props.size}`);
const emoji = computed(() => {
  const n = props.name ?? '';
  if (/锅|辣|川/.test(n)) return '🍲';
  if (/面|粉|米/.test(n)) return '🍜';
  if (/饭|盖浇/.test(n)) return '🍚';
  if (/饮|茶|奶/.test(n)) return '🧋';
  if (/鸡|肉/.test(n)) return '🍗';
  return '🍱';
});
</script>

<style scoped lang="scss">
.thumb {
  border-radius: 20rpx;
  background: #efeae6;
  flex-shrink: 0;
  overflow: hidden;
}

.size-sm {
  width: 96rpx;
  height: 96rpx;
}

.size-md {
  width: 160rpx;
  height: 160rpx;
}

.size-lg {
  width: 100%;
  height: 280rpx;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #65c3c8 0%, #ef9fbc 100%);
}

.emoji {
  font-size: 56rpx;
}

.size-sm .emoji {
  font-size: 36rpx;
}
</style>
