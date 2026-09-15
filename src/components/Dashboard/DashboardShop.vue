<script setup lang="ts">
import CatalogList from "@/components/Catalog/CatalogMain.vue";
import RateControl from "@/components/Rate/RateControl.vue";
import {computed, onMounted, onUnmounted, provide, ref} from 'vue';
import {type ICatalogGroup, PriceTrendKey, UsdRateKey} from "@/struct";
import {useMarketData, buildKey} from "@/composables/useMarketData";
import {useCart} from "@/composables/useCart";
import CartMain from "@/components/Cart/CartMain.vue";

// --- Данные рынка ---
const {
  usdRate,
  productsByKey,
  priceTrend,
  loadInitialData,
  refreshMarket,
  dispose: disposeMarketData,
} = useMarketData();

provide(UsdRateKey, usdRate);
provide(PriceTrendKey, priceTrend);

// --- Данные корзины ---
const {
  cartEntries,
  cartTotalUsd,
  addToCart,
  increaseAmountProduct,
  reduceAmountProduct,
  deleteFromCart,
  setAmountProduct,
} = useCart(productsByKey);

const cartQuantityByKey = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  cartEntries.value.forEach(entry => {
    map[buildKey(entry.groupId, entry.id)] = entry.quantity;
  });
  return map;
});

const catalogList = computed<ICatalogGroup[]>(() => {
  const groupsMap: Record<number, ICatalogGroup> = {};

  Object.values(productsByKey.value).forEach(info => {
    if (!groupsMap[info.groupId]) {
      groupsMap[info.groupId] = {id: info.groupId, name: info.categoryName, items: []};
    }

    const reserved = cartQuantityByKey.value[buildKey(info.groupId, info.id)] || 0;

    groupsMap[info.groupId]?.items.push({
      id: info.id,
      groupId: info.groupId,
      name: info.name,
      priceUsd: info.priceUsd,
      available: info.stock - reserved,
    });
  });

  return Object.values(groupsMap).sort((a, b) => a.id - b.id);
});

const cartDisplayList = computed(() => {
  return cartEntries.value.map(entry => {
    const key = buildKey(entry.groupId, entry.id);
    const info = productsByKey.value[key];

    if (!info) {
      return {
        id: entry.id,
        groupId: entry.groupId,
        name: `Товар #${entry.id}`,
        categoryName: '—',
        priceUsd: 0,
        available: 0,
        quantity: entry.quantity,
      };
    }

    return {
      id: info.id, groupId: info.groupId,
      name: info.name, categoryName: info.categoryName,
      priceUsd: info.priceUsd, available: info.stock - entry.quantity,
      quantity: entry.quantity,
    };
  });
});

// Таймер обновления
const INTERVAL_TIME = 15000;
let rafId: number | null = null;
let lastTimestamp: number | null = null;
const timeToUpdateMs = ref(INTERVAL_TIME);

const tick = (timestamp: number) => {
  if (!lastTimestamp) lastTimestamp = timestamp;

  const elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (timeToUpdateMs.value > 0) {
    timeToUpdateMs.value = Math.max(0, timeToUpdateMs.value - elapsed);
  } else {
    refreshMarket();
    timeToUpdateMs.value = INTERVAL_TIME;
  }
  rafId = requestAnimationFrame(tick);
};
const manualUpdateTimer = async (): Promise<void> => {
  lastTimestamp = performance.now();
  timeToUpdateMs.value = INTERVAL_TIME;
  await refreshMarket();
};

onMounted(async () => {
  await loadInitialData();
  rafId = requestAnimationFrame(tick);
});
onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  disposeMarketData();
});
</script>

<template>
  <div class="shop">
    <div class="shop-head">
      <h1>Каталог товаров с корзиной</h1>
      <RateControl
          v-model="usdRate"
          :time-to-update-ms="timeToUpdateMs"
          @update-timer="manualUpdateTimer"
      />
    </div>
    <div class="shop-main">
      <CatalogList
          class="shop-main__catalog"
          :catalog-list="catalogList"
          @add-to-cart="addToCart"
      />
      <CartMain
          class="shop-main__cart"
          :cart-list="cartDisplayList"
          :cart-total-usd="cartTotalUsd"
          @delete-from-cart="deleteFromCart"
          @reduce-amount-product="reduceAmountProduct"
          @increase-amount-product="increaseAmountProduct"
          @set-amount-product="setAmountProduct"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.shop {
  &-head {
    margin-bottom: 50px;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    @media (max-width: 1024px) {
      flex-direction: column;
    }
  }
  &-main {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    @media (max-width: 1024px) {
      flex-direction: column;
    }
    &__catalog {
      flex: 1;
    }
    &__cart {
      flex: 1;

    }
  }
}
</style>