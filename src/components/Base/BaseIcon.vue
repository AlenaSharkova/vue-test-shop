<template>
  <div
    class="base-icon"
    :class="[`--${props.position}`]"
  >
    <div class="base-icon-mask" :style="[maskStyles]" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import type { PropType } from "@vue/runtime-core";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  position: {
    type: String as PropType<"left" | "right" | "bottom" | "top">,
    default: "right",
  },
  folder: {
    type: String,
    default: "",
  },
});
const maskStyles = computed(() => {
  const url = `/img/base-icons/${props.folder ? props.folder + "/" : ""}${
    props.name
  }.svg`;
  return {
    mask: `url(${url}) no-repeat center / contain`,
    "-webkit-mask": `url(${url}) no-repeat center / contain`,
  };
});
</script>

<style scoped lang="scss">
.base-icon {
  display: block;
  width: 1em;
  min-width: 1em;
  height: 1em;
  line-height: 1;
  color: inherit;
  flex-shrink: 0;
  transition: all 0.2s ease;
  font-size: var(--icon-size, 24px);

  &-mask {
    vertical-align: -0.15em;
    display: inline-block;
    background: currentColor;

    font-size: inherit;
    line-height: 1;
    color: inherit;

    height: inherit;
    width: inherit;
  }
  &.--left {
    transform: scale(-1, 1);
  }
  &.--bottom {
    transform: rotate(90deg) scaleX(1);
  }
  &.--top {
    transform: rotate(90deg) scaleX(-1);
  }
}
</style>
