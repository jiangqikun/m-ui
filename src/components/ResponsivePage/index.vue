<template>
  <div
    :class="['m-responsive-page', { 'm-responsive-page--fullscreen': fullscreen }]"
    :style="containerStyle"
  >
    <div
      ref="contentRef"
      :class="['m-responsive-page__content', { 'm-responsive-page__content--scaled': enableScale && scaleX > 0 && scaleY > 0 }]"
      :style="contentStyle"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import debounce from "lodash/debounce";
import type { ResponsivePageProps } from "./types";

defineOptions({
  name: "MResponsivePage",
});

const props = withDefaults(defineProps<ResponsivePageProps>(), {
  width: "100%",
  height: "100%",
  minWidth: undefined,
  minHeight: undefined,
  maxWidth: undefined,
  maxHeight: undefined,
  fullscreen: false,
  backgroundColor: undefined,
  padding: undefined,
  breakpoints: () => ({
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1920,
  }),
  enableScale: false,
  baseWidth: 1920,
  baseHeight: 1080,
  scaleMode: "fit",
});

const scaleX = ref(1);
const scaleY = ref(1);

// 计算容器样式
const containerStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.fullscreen) {
    style.width = "100vw";
    style.height = "100vh";
  } else {
    if (typeof props.width === "number") {
      style.width = `${props.width}px`;
    } else {
      style.width = props.width;
    }

    if (typeof props.height === "number") {
      style.height = `${props.height}px`;
    } else {
      style.height = props.height;
    }
  }

  if (props.minWidth !== undefined) {
    style.minWidth = typeof props.minWidth === "number" ? `${props.minWidth}px` : props.minWidth;
  }

  if (props.minHeight !== undefined) {
    style.minHeight = typeof props.minHeight === "number" ? `${props.minHeight}px` : props.minHeight;
  }

  if (props.maxWidth !== undefined) {
    style.maxWidth = typeof props.maxWidth === "number" ? `${props.maxWidth}px` : props.maxWidth;
  }

  if (props.maxHeight !== undefined) {
    style.maxHeight = typeof props.maxHeight === "number" ? `${props.maxHeight}px` : props.maxHeight;
  }

  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor;
  }

  if (props.padding !== undefined) {
    style.padding = typeof props.padding === "number" ? `${props.padding}px` : props.padding;
  }

  return style;
});

// 计算内容样式
const contentStyle = computed(() => {
  const style: Record<string, string> = {};

  if (props.enableScale) {
    // 固定内容区域为基准尺寸
    style.width = `${props.baseWidth}px`;
    style.height = `${props.baseHeight}px`;
    
    // 使用 scale(scaleX, scaleY) 同时缩放 X 和 Y 轴
    style.transform = `scale(${scaleX.value}, ${scaleY.value})`;
    style.transformOrigin = "left top";
  }

  return style;
});

// 获取缩放比例（参考 demo.vue 的逻辑）
const getScale = () => {
  if (!props.enableScale) {
    return [1, 1];
  }

  const w = window.innerWidth / props.baseWidth;
  const h = window.innerHeight / props.baseHeight;

  // 根据缩放模式返回不同的缩放比例
  switch (props.scaleMode) {
    case "width":
      return [w, w];
    case "height":
      return [h, h];
    case "both":
      const minScale = Math.min(w, h);
      return [minScale, minScale];
    case "fit":
    default:
    //   const fitScale = Math.min(w, h);
    //   return [fitScale, fitScale];
      return [w, h];
  }
};

// 设置缩放比例
const setScale = () => {
  if (!props.enableScale) {
    scaleX.value = 1;
    scaleY.value = 1;
    return;
  }

  const [x, y] = getScale();
  scaleX.value = x;
  scaleY.value = y;
};

// 防抖处理 resize 事件
const debouncedSetScale = debounce(setScale, 100);

onMounted(() => {
  if (props.enableScale) {
    setScale();
    window.addEventListener("resize", debouncedSetScale);
  }
});

onBeforeUnmount(() => {
  if (props.enableScale) {
    window.removeEventListener("resize", debouncedSetScale);
  }
});

// 监听相关属性变化
watch(
  () => [props.enableScale, props.baseWidth, props.baseHeight, props.scaleMode],
  () => {
    if (props.enableScale) {
      setScale();
    } else {
      scaleX.value = 1;
      scaleY.value = 1;
    }
  }
);
</script>

<style lang="scss" scoped>
.m-responsive-page {
  @apply relative overflow-hidden;
  position: relative;

  &--fullscreen {
    @apply fixed top-0 left-0 w-screen h-screen;
  }

  &__content {
    @apply w-full h-full;
    transition: transform 0.3s ease;

    &--scaled {
      will-change: transform;
    }
  }
}

// 响应式断点样式
@media (max-width: 640px) {
  .m-responsive-page {
    // xs 样式
  }
}

@media (min-width: 640px) and (max-width: 767px) {
  .m-responsive-page {
    // sm 样式
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .m-responsive-page {
    // md 样式
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  .m-responsive-page {
    // lg 样式
  }
}

@media (min-width: 1280px) and (max-width: 1919px) {
  .m-responsive-page {
    // xl 样式
  }
}

@media (min-width: 1920px) {
  .m-responsive-page {
    // 2xl 样式
  }
}
</style>

