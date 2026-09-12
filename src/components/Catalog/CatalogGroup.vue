<script setup lang="ts">
import {type PropType, ref} from "vue";
import type {ICatalogGroup, ICatalogProduct} from "@/struct";
import CatalogProduct from "@/components/Catalog/CatalogProduct.vue";
import BaseIcon from "@/components/Base/BaseIcon.vue";

const props = defineProps({
  group: {
    type: Object as PropType<ICatalogGroup>,
    required: true,
  }
})

const emits = defineEmits<{
  (e: 'add-to-cart', product: ICatalogProduct): void;
}>();

const isShowCategory = ref(false)
const toggleCategory = () => {
  isShowCategory.value = !isShowCategory.value
}
const addToCart = (product: ICatalogProduct) => {
  emits('add-to-cart', product)
}
</script>

<template>
  <div class="catalog-group">
    <div
        class="catalog-group__head"
        @click="toggleCategory"
    >
      <BaseIcon
          class="catalog-group__head-arrow"
          name="arrow-right"
          :position="isShowCategory? 'right': 'bottom'" />
      <p class="catalog-group__head-name">{{group.name}}</p>
    </div>
    <div
        v-if="isShowCategory"
        class="catalog-group__products">
      <CatalogProduct
          v-for="product in group.items"
          :key="product.id"
          :product="product"
          class="product-item"
          @add-to-cart="addToCart(product)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.catalog-group {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-base);
  box-shadow: var(--box-shadow-primary);
  &__head {
    padding: 10px 15px;
    display: flex;
    gap: 15px;
    background: var(--bg-primary);
    cursor: pointer;
    color: var(--color-text-primary);
    align-items: center;
    &-arrow {
      font-size: 16px;
    }
    &-name {
      font-size: 15px;
      font-weight: bold;
    }
  }
  &__products {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}
</style>