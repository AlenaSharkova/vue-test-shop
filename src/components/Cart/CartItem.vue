<script setup lang="ts">
import type {PropType} from "vue";
import {computed, ref, watch} from "vue";
import type {ICartDisplayItem} from "@/struct";
import BaseIcon from "@/components/Base/BaseIcon.vue";
import {convertToRub} from "@/utils";

const props = defineProps({
  product: {
    type: Object as PropType<ICartDisplayItem>,
    required: true,
  }
})

const emits = defineEmits<{
  (e: 'delete-from-cart', id: number, groupId: number): void;
  (e: 'reduce-amount-product', id: number, groupId: number): void;
  (e: 'increase-amount-product', id: number, groupId: number): void;
  (e: 'set-amount-product', id: number, groupId: number, quantity: number): void;
}>();

const deleteFromCart = () => {
  emits('delete-from-cart', props.product.id, props.product.groupId)
}

const disabledQuantity = (status: 'plus' | 'minus') => {
  if(status === 'plus') return props.product.available <= 0
  else return props.product.quantity === 1
}
const reduceAmountProduct = () => {
  if(props.product.quantity === 1) return
  emits('reduce-amount-product', props.product.id, props.product.groupId)
}
const increaseAmountProduct = () => {
  if(props.product.available <= 0) return
  emits('increase-amount-product', props.product.id, props.product.groupId)
}

const blockNonDigits = (event: InputEvent) => {
  if (event.data && /\D/.test(event.data)) {
    event.preventDefault();
  }
}

const quantityMaxLength = computed(() => String(props.product.quantity + props.product.available).length);

const draftQuantity = ref<string>(String(props.product.quantity));

watch(() => props.product.quantity, (newQuantity) => {
  draftQuantity.value = String(newQuantity);
});

const isInvalidInput = ref(false);

const checkValidity = () => {
  const maxAvailable = props.product.quantity + props.product.available;
  const parsed = Number(draftQuantity.value);

  isInvalidInput.value =
      draftQuantity.value === '' ||
      Number.isNaN(parsed) ||
      parsed < 1 ||
      parsed > maxAvailable;
}

const onQuantityChange = () => {
  const maxAvailable = props.product.quantity + props.product.available;
  const parsed = Number(draftQuantity.value);
  const clamped = Math.min(Math.max(Math.round(parsed) || 1, 1), maxAvailable);

  draftQuantity.value = String(clamped);
  isInvalidInput.value = false;
  emits('set-amount-product', props.product.id, props.product.groupId, clamped);
}
</script>

<template>
  <div class="cart-item">
    <div class="cart-item__category">
      <p class="category-name">{{product.categoryName}}</p>
    </div>
    <div class="cart-item__name">
      <span>{{product.name}}</span>
    </div>
    <div class="cart-item__quantity">
      <button
          class="quantity-action --minus"
          :class="{'--disabled': disabledQuantity('minus')}"
          @click="reduceAmountProduct"

      >
        <span>-</span>
      </button>
      <div class="quantity-value">
        <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            :maxlength="quantityMaxLength"
            class="quantity-value__input"
            :class="{'--invalid': isInvalidInput}"
            v-model="draftQuantity"
            @beforeinput="blockNonDigits"
            @input="checkValidity"
            @change="onQuantityChange"
            @keyup.enter="($event.target as HTMLInputElement).blur()"
        />
      </div>
      <button
          class="quantity-action --plus"
          :class="{'--disabled': disabledQuantity('plus')}"
          @click="increaseAmountProduct"
      >
        <span>+</span>
      </button>
    </div>
    <div
        class="cart-item__price"
        :class="{
          '--up': product.priceTrend === 'up',
          '--down': product.priceTrend === 'down'
        }"
    >
      <span>{{convertToRub(product.priceUsd)}}/шт.</span>
    </div>
    <div class="cart-item__delete">
      <BaseIcon name="delete" @click="deleteFromCart" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.cart-item {
  display: grid;
  grid-template-columns: 1fr 2fr 90px 100px 30px;
  gap: 20px;
  align-items: center;
  &__category {
    .category-name {
      border-radius: 5px;
      background: var(--bg-accent);
      color: var(--color-text-accent);
      padding: 2px 5px;
      width: max-content;
      font-size: 14px;
    }
  }
  &__quantity {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
    .quantity-value {
      width: 26px;
      text-align: center;
      &__input {
        width: 100%;
        text-align: center;
        background: transparent;
        font-size: inherit;
        color: inherit;
        font-family: inherit;
        -moz-appearance: textfield;
        border: 1px solid var(--bg-accent);
        border-radius: 5px;
        box-shadow: var(--box-shadow-primary);

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        &:focus {
          outline: none;
        }
        &.--invalid {
          color: #c0392b;
          border-color: #c0392b;
        }
      }
    }
    .quantity-action {
      width: 20px;
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--bg-accent);
      border-radius: 5px;
      flex-shrink: 0;
      color: var(--color-text-accent);
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.3s;
      font-size: 18px;
      @media (hover: hover) {
        &:hover {
          border: 1px solid var(--border-base);
        }
      }
      &:active {
        opacity: 0.8;
      }
      &.--disabled {
        opacity: 0.3;
        pointer-events: none;
      }
    }
  }
  &__price {
    font-size: 14px;
    border-radius: 5px;
    padding: 3px 5px;
    transition: background-color 0.4s ease, color 0.4s ease;
    &.--up {
      background-color: #fbdede;
      color: #c0392b;
    }
    &.--down {
      background-color: #ddf5e2;
      color: #1e8449;
    }
  }
  &__delete {
    cursor: pointer;
  }
}
</style>