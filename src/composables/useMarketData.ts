import {ref, shallowRef, watch} from 'vue';
import type {IGoodsResponse, INamesDataResponse, IRawGood} from '@/struct';

export interface IProductInfo {
    id: number;
    groupId: number;
    name: string;
    categoryName: string;
    priceUsd: number;
    stock: number; // P из data.json — общий остаток на складе, без учёта корзины
}

const RATE_MIN = 20;
const RATE_MAX = 80;
const TREND_HIGHLIGHT_MS = 3000;

export const buildKey = (groupId: number, id: number) => `${groupId}_${id}`;

export function useMarketData() {
    const usdRate = ref(72);

    const productsByKey = shallowRef<Record<string, IProductInfo>>({});

    const priceTrend = ref<'up' | 'down' | null>(null);
    let trendTimeoutId: ReturnType<typeof setTimeout> | null = null;

    watch(usdRate, (newRate, oldRate) => {
        if (oldRate === undefined || newRate === oldRate) return;

        priceTrend.value = newRate > oldRate ? 'up' : 'down';

        if (trendTimeoutId) clearTimeout(trendTimeoutId);
        trendTimeoutId = setTimeout(() => {
            priceTrend.value = null;
        }, TREND_HIGHLIGHT_MS);
    });

    let namesData: INamesDataResponse | null = null;

    const buildProductsMap = (goods: IRawGood[], names: INamesDataResponse): Record<string, IProductInfo> => {
        const map: Record<string, IProductInfo> = {};
        goods.forEach(good => {
            map[buildKey(good.G, good.T)] = {
                id: good.T,
                groupId: good.G,
                name: names[good.G]?.B?.[good.T]?.N || `Товар #${good.T}`,
                categoryName: names[good.G]?.G || `Категория ${good.G}`,
                priceUsd: good.C,
                stock: good.P,
            };
        });
        return map;
    };

    const loadInitialData = async (): Promise<void> => {
        try {
            const [namesRes, goodsRes] = await Promise.all([
                fetch('/data/names.json'),
                fetch('/data/data.json'),
            ]);
            namesData = await namesRes.json();
            const goodsData: IGoodsResponse = await goodsRes.json();
            productsByKey.value = buildProductsMap(goodsData.Value?.Goods || [], namesData!);
        } catch (err) {
            console.error('Ошибка первичной загрузки data.json/names.json:', err);
        }
    };

    const refreshMarket = async (): Promise<void> => {
        try {
            const res = await fetch('/data/data.json');
            const goodsData: IGoodsResponse = await res.json();
            const incomingGoods = goodsData.Value?.Goods || [];
            const newRate = Math.floor(Math.random() * (RATE_MAX - RATE_MIN + 1)) + RATE_MIN;

            if (namesData) {
                productsByKey.value = buildProductsMap(incomingGoods, namesData);
            }
            usdRate.value = newRate;
        } catch (err) {
            console.error("Ошибка чтения файла data.json:", err);
        }
    };

    const dispose = () => {
        if (trendTimeoutId) clearTimeout(trendTimeoutId);
    };

    return {
        usdRate,
        productsByKey,
        priceTrend,
        loadInitialData,
        refreshMarket,
        dispose,
        RATE_MIN,
        RATE_MAX,
    };
}