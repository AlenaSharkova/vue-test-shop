<script setup lang="ts">
import {computed, type PropType} from "vue";
import type {ICartDisplayItem} from "@/struct";
import {convertToRub} from "@/utils";
import CartItem from "@/components/Cart/CartItem.vue";

const props = defineProps({
  cartList: {
    type: Object as PropType<ICartDisplayItem[]>,
    required: true,
  }
})

const emits = defineEmits<{
  (e: 'delete-from-cart', id: number, groupId: number): void;
  (e: 'reduce-amount-product', id: number, groupId: number): void;
  (e: 'increase-amount-product', id: number, groupId: number): void;
  (e: 'set-amount-product', id: number, groupId: number, quantity: number): void;
}>();

const totalPrice = computed(() => {
  const totalUsd = props.cartList.reduce((acc: number, item: ICartDisplayItem) => {
    return item.priceUsd * item.quantity + acc;
  }, 0)
  return convertToRub(totalUsd);
})

const deleteFromCart = (productId: number, groupId: number) => {
  emits('delete-from-cart', productId, groupId)
}
const reduceAmountProduct = (productId: number, groupId: number) => {
  emits('reduce-amount-product', productId, groupId)
}
const increaseAmountProduct = (productId: number, groupId: number) => {
  emits('increase-amount-product', productId, groupId)
}
const setAmountProduct = (productId: number, groupId: number, quantity: number) => {
  emits('set-amount-product', productId, groupId, quantity)
}
</script>

<template>
  <div class="cart">
    <div class="cart-wrapper">
      <div class="cart-title">
        <span>Корзина</span>
      </div>
      <div v-if="cartList.length" class="cart-list">
        <CartItem
            v-for="item in cartList"
            :key="`${item.groupId}_${item.id}`"
            :product="item"
            class="cart-item"
            @delete-from-cart="deleteFromCart"
            @reduce-amount-product="reduceAmountProduct"
            @increase-amount-product="increaseAmountProduct"
            @set-amount-product="setAmountProduct"
        />
      </div>
      <div v-else class="cart-empty">
        <span>Здесь пока пусто!<br> Добавьте товары из каталога</span>

      </div>
      <div class="cart-summary">
        <p>Общая стоимость:</p>
        <div class="cart-summary__total">
          <span>{{totalPrice}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cart {
  min-width: 200px;
  border-radius: 10px;
  background: var(--bg-primary);
  position: relative;
  box-shadow: var(--box-shadow-primary);
  @media (max-width: 1024px) {
    width: 100%;
  }
  &-wrapper {
    padding: 7px 12px;
    font-size: 16px;
  }
  &-title {
    font-size: 18px;
    font-weight: bold;
  }
  &-list {
    padding-bottom: 14px;
    display: flex;
    flex-direction: column;
  }
  &-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    span {
      text-align: center;
    }
  }
  &-item {
    padding-bottom: 10px;
    padding-top: 10px;
    &:not(:last-child) {
      border-bottom: 1px solid var(--border-base);
    }
  }
  &-summary {
    padding: 7px 0;
    font-size: 18px;
    border-top: 2px solid var(--border-base);
    &__total {
      font-size: 20px;
    }
  }
}
</style>