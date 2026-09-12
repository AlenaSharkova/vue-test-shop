<script setup lang="ts">
import type {PropType} from "vue";
import type {ICatalogGroup, ICatalogProduct} from "@/struct";
import CatalogGroup from "@/components/Catalog/CatalogGroup.vue";

const props = defineProps({
  catalogList: {
    type: Object as PropType<ICatalogGroup[]>,
    required: true,
  }
})
const emits = defineEmits<{
  (e: 'add-to-cart', product: ICatalogProduct): void;
}>();

const addToCart = (product: ICatalogProduct) => {
  emits('add-to-cart', product)
}
</script>

<template>

  <div class="catalog">
    <div class="catalog-list">
      <CatalogGroup
          v-for="group in catalogList"
          :key="group.id"
          :group="group"
          class="catalog-group"
          @add-to-cart="addToCart"
      />
    </div>
  </div>

</template>

<style scoped lang="scss">
.catalog {
  @media (max-width: 1024px) {
    width: 100%;
  }
  &-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  &-group {
    border-radius: 10px;
    &__head {
      padding: 5px;
      display: flex;
      gap: 5px;
      background: var(--bg-primary);
      &-name {
      }
    }
    &__products {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  }
}
</style>