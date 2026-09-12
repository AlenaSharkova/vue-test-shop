<script setup lang="ts">
import {computed, type PropType} from "vue";
import type {ICatalogProduct} from "@/struct";
import {convertToRub} from "@/utils";

const props = defineProps({
  product: {
    type: Object as PropType<ICatalogProduct>,
    required: true,
  }
})
const emits = defineEmits<{
  (e: 'add-to-cart'): void;
}>();

const addToCart = () => {
  emits('add-to-cart')
}

const isGoodsStock = computed(() => props.product.available <= 0)
</script>

<template>
  <div class="catalog-product">
    <div class="catalog-product__wrapper">
      <div class="catalog-product__name">
        <span>{{product.name}}</span>
        priceTrend: {{product.priceTrend}}
        <span class="product-available"> ({{product.available}} шт.)</span>
      </div>
      <div
          class="catalog-product__price"
          :class="{
            'catalog-product__price--up': product.priceTrend === 'up',
            'catalog-product__price--down': product.priceTrend === 'down'
          }"
      >
        <span>{{convertToRub(product.priceUsd)}}</span>
      </div>
      <div class="catalog-product__add">
        <button
            class="catalog-product__add-btn"
            :class="{'--disabled': isGoodsStock}"
            :disabled="isGoodsStock"
            @click="addToCart"
        >Купить</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.catalog-product {
  &__wrapper {
    display: grid;
    grid-template-columns: 1fr 90px auto;
    align-items: center;
    gap: 20px;
    @media (max-width: 1024px) {
      grid-template-columns: 1fr minmax(auto, 90px) auto;
      gap: 10px;

    }
  }
  &__name {
    .product-available {
      color: var(--color-text-light);
      font-size: 12px;
    }
  }
  &__price {
    border-radius: 5px;
    font-size: 13px;
    padding: 5px 7px;
    background-color: var(--bg-secondary);
    display: flex;
    align-items: center;
    transition: background-color 0.4s ease, color 0.4s ease;
    &--up {
      background-color: #fbdede;
      color: #c0392b;
    }
    &--down {
      background-color: #ddf5e2;
      color: #1e8449;
    }
  }
  &__add {
    &-btn {
      background: var(--bg-action);
      color: var(--color-text-action);
      padding: 8px 20px;
      border-radius: 5px;
      border: none;
      cursor: pointer;
      transition: all 0.5s;
      font-size: 15px;
      &.--disabled {
        opacity: 0.4;
        pointer-events: none;
      }
      @media (hover: hover) {
        &:hover {
          background: color-mix(in srgb, var(--bg-action) 90%, black 10%);
        }
      }
      &:active {
        color: var(--color-text-primary);
        background: color-mix(in srgb, var(--bg-action) 50%, white 50%);
      }
    }
  }
}
</style>