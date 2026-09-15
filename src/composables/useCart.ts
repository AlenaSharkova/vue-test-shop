import {ref, watch, type Ref} from 'vue';
import type {ICartEntry, ICatalogProduct} from '@/struct';
import type {IProductInfo} from './useMarketData';
import {buildKey} from './useMarketData';

export function useCart(productsByKey: Ref<Record<string, IProductInfo>>) {
    const cartEntries = ref<ICartEntry[]>([]);

    const cartTotalUsd = ref(0);

    const findEntry = (id: number, groupId: number): ICartEntry | undefined =>
        cartEntries.value.find(e => e.id === id && e.groupId === groupId);

    const priceOf = (id: number, groupId: number): number =>
        productsByKey.value[buildKey(groupId, id)]?.priceUsd ?? 0;

    const stockOf = (id: number, groupId: number): number | undefined =>
        productsByKey.value[buildKey(groupId, id)]?.stock;

    const recalcTotal = () => {
        cartTotalUsd.value = cartEntries.value.reduce(
            (acc, entry) => acc + priceOf(entry.id, entry.groupId) * entry.quantity,
            0
        );
    };
    watch(productsByKey, recalcTotal);

    const addToCart = (product: ICatalogProduct) => {
        const existing = findEntry(product.id, product.groupId);
        if (existing) {
            existing.quantity++;
        } else {
            cartEntries.value.push({id: product.id, groupId: product.groupId, quantity: 1});
        }
        cartTotalUsd.value += product.priceUsd;
    };

    const increaseAmountProduct = (id: number, groupId: number) => {
        const entry = findEntry(id, groupId);
        if (!entry) return;

        const stock = stockOf(id, groupId);
        if (stock !== undefined && entry.quantity >= stock) return; // больше склада не наберём

        entry.quantity++;
        cartTotalUsd.value += priceOf(id, groupId);
    };

    const reduceAmountProduct = (id: number, groupId: number) => {
        const entry = findEntry(id, groupId);
        if (!entry) return;

        entry.quantity--;
        cartTotalUsd.value -= priceOf(id, groupId);

        if (entry.quantity <= 0) deleteFromCart(id, groupId);
    };

    const deleteFromCart = (id: number, groupId: number) => {
        const entry = findEntry(id, groupId);
        if (entry) {
            cartTotalUsd.value -= priceOf(id, groupId) * entry.quantity;
        }
        cartEntries.value = cartEntries.value.filter(e => !(e.id === id && e.groupId === groupId));
    };

    const setAmountProduct = (id: number, groupId: number, quantity: number) => {
        const entry = findEntry(id, groupId);
        if (!entry) return;

        const stock = stockOf(id, groupId) ?? entry.quantity;
        const clamped = Math.min(Math.max(Math.round(quantity) || 1, 1), stock);
        const delta = clamped - entry.quantity;

        entry.quantity = clamped;
        cartTotalUsd.value += delta * priceOf(id, groupId);
    };

    return {
        cartEntries,
        cartTotalUsd,
        addToCart,
        increaseAmountProduct,
        reduceAmountProduct,
        deleteFromCart,
        setAmountProduct,
    };
}