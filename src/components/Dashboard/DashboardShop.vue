<script setup lang="ts">
import CatalogList from "@/components/Catalog/CatalogMain.vue";
import RateControl from "@/components/Rate/RateControl.vue";
import {computed, onMounted, onUnmounted, provide, ref, watch} from 'vue';
import {
  type ICartEntry,
  type ICartDisplayItem,
  type ICatalogGroup, type ICatalogProduct,
  type IGoodsResponse,
  type INamesDataResponse,
  type IRawGood,
  UsdRateKey
} from "@/struct";
import CartMain from "@/components/Cart/CartMain.vue";

const namesData = ref<INamesDataResponse | null>(null)
const rawGoods = ref<IRawGood[] | null>(null)
const usdRate = ref(72);

provide(UsdRateKey, usdRate);

const INTERVAL_TIME = 15000;

let rafId: number | null = null;
let lastTimestamp: number | null = null;
const timeToUpdateMs = ref(INTERVAL_TIME);

const cartEntries = ref<ICartEntry[]>([]);

const priceTrends = ref<Record<string, 'up' | 'down'>>({});
const trendTimeoutIds: Record<string, ReturnType<typeof setTimeout>> = {};
const TREND_HIGHLIGHT_MS = 3000;

const buildKey = (groupId: number, id: number) => `${groupId}_${id}`;

interface IProductInfo {
  id: number;
  groupId: number;
  name: string;
  categoryName: string;
  priceUsd: number;
  stock: number; // P из data.json (общий остаток на складе, без учёта корзины)
  priceTrend: 'up' | 'down' | null;
}

const productsByKey = computed<Record<string, IProductInfo>>(() => {
  const map: Record<string, IProductInfo> = {};
  if (!namesData.value || !rawGoods.value) return map;

  rawGoods.value.forEach(good => {
    const key = buildKey(good.G, good.T);
    map[key] = {
      id: good.T,
      groupId: good.G,
      name: namesData.value![good.G]?.B?.[good.T]?.N || `Товар #${good.T}`,
      categoryName: namesData.value![good.G]?.G || `Категория ${good.G}`,
      priceUsd: good.C,
      stock: good.P,
      priceTrend: priceTrends.value[key] ?? null
    };
  });

  return map;
});

const cartQuantityByKey = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {};
  cartEntries.value.forEach(entry => {
    map[buildKey(entry.groupId, entry.id)] = entry.quantity;
  });
  return map;
});

// Каталог для отображения
const catalogList = computed<ICatalogGroup[]>(() => {
  const groupsMap: Record<number, ICatalogGroup> = {};

  Object.values(productsByKey.value).forEach(info => {
    if (!groupsMap[info.groupId]) {
      groupsMap[info.groupId] = {id: info.groupId, name: info.categoryName, items: []};
    }

    const reserved = cartQuantityByKey.value[buildKey(info.groupId, info.id)] || 0;

    groupsMap[info.groupId].items.push({
      id: info.id,
      groupId: info.groupId,
      name: info.name,
      priceUsd: info.priceUsd,
      available: info.stock - reserved,
      priceTrend: info.priceTrend
    });
  });

  return Object.values(groupsMap).sort((a, b) => a.id - b.id);
});

// Корзина для отображения: количество из cartEntries (то, что реально выбрал пользователь), а имя/цену/остаток/тренд — live из productsByKey. При обновлении data.json цена в корзине обновится сама, без заморозки.
const cartDisplayList = computed<ICartDisplayItem[]>(() => {
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
        priceTrend: null,
        available: 0,
        quantity: entry.quantity
      };
    }

    return {
      id: info.id,
      groupId: info.groupId,
      name: info.name,
      categoryName: info.categoryName,
      priceUsd: info.priceUsd,
      priceTrend: info.priceTrend,
      available: info.stock - entry.quantity,
      quantity: entry.quantity
    };
  });
});

const loadStaticNames = async () => {
  try {
    const res = await fetch('/data/names.json');
    namesData.value = await res.json();
  } catch (err) {
    console.error("Ошибка чтения файла names.json:", err);
  }
};

// Первичная загрузка на старте
const loadInitialGoods = async (): Promise<void> => {
  try {
    const res = await fetch('/data/data.json');
    const goodsData: IGoodsResponse = await res.json();
    rawGoods.value = goodsData.Value?.Goods || [];
  } catch (err) {
    console.error("Ошибка чтения файла data.json:", err);
  }
};

const toRubPrice = (priceUsd: number, rate: number) => priceUsd * rate;

let prevRubSnapshot: Map<string, number> | null = null;

watch([usdRate, rawGoods], ([rate, goods]) => {
  if (!goods) return;

  const nextSnapshot = new Map<string, number>();
  goods.forEach(g => nextSnapshot.set(buildKey(g.G, g.T), toRubPrice(g.C, rate)));

  if (prevRubSnapshot) {
    nextSnapshot.forEach((newRub, key) => {
      const prevRub = prevRubSnapshot!.get(key);
      if (prevRub === undefined || prevRub === newRub) return;

      priceTrends.value[key] = newRub > prevRub ? 'up' : 'down';

      if (trendTimeoutIds[key]) clearTimeout(trendTimeoutIds[key]);
      trendTimeoutIds[key] = setTimeout(() => {
        delete priceTrends.value[key];
        priceTrends.value = {...priceTrends.value};
      }, TREND_HIGHLIGHT_MS);
    });
    priceTrends.value = {...priceTrends.value};
  }

  prevRubSnapshot = nextSnapshot;
});

const refreshMarket = async (): Promise<void> => {
  try {
    const res = await fetch('/data/data.json');
    const goodsData: IGoodsResponse = await res.json();
    const incomingGoods = goodsData.Value?.Goods || [];
    const newRate = Math.floor(Math.random() * (80 - 20 + 1)) + 20;

    rawGoods.value = incomingGoods;
    usdRate.value = newRate;
  } catch (err) {
    console.error("Ошибка чтения файла data.json:", err);
  }
};

const addToCart = (product: ICatalogProduct) => {
  const existing = cartEntries.value.find(
      e => e.id === product.id && e.groupId === product.groupId
  );
  if (existing) {
    existing.quantity++;
  } else {
    cartEntries.value.push({id: product.id, groupId: product.groupId, quantity: 1});
  }
};

const increaseAmountProduct = (id: number, groupId: number) => {
  const entry = cartEntries.value.find(e => e.id === id && e.groupId === groupId);
  const stock = productsByKey.value[buildKey(groupId, id)]?.stock;
  if (!entry) return;
  if (stock !== undefined && entry.quantity >= stock) return;
  entry.quantity++;
};

const reduceAmountProduct = (id: number, groupId: number) => {
  const entry = cartEntries.value.find(e => e.id === id && e.groupId === groupId);
  if (!entry) return;

  entry.quantity--;
  if (entry.quantity <= 0) deleteFromCart(id, groupId);
};

const deleteFromCart = (id: number, groupId: number) => {
  cartEntries.value = cartEntries.value.filter(e => !(e.id === id && e.groupId === groupId));
};

// Ручной ввод количества в корзине.
const setAmountProduct = (id: number, groupId: number, quantity: number) => {
  const entry = cartEntries.value.find(e => e.id === id && e.groupId === groupId);
  if (!entry) return;

  const stock = productsByKey.value[buildKey(groupId, id)]?.stock ?? entry.quantity;
  entry.quantity = Math.min(Math.max(Math.round(quantity) || 1, 1), stock);
};

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
  await loadStaticNames();
  await loadInitialGoods();
  rafId = requestAnimationFrame(tick);
});
onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  Object.values(trendTimeoutIds).forEach(clearTimeout);
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