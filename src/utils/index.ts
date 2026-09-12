import {inject} from "vue";
import {UsdRateKey} from "@/struct";

export function convertToRub(priceUsd: number): string {
    const rate = inject(UsdRateKey);

    const currentRate = rate ? rate.value : 65;

    return formatToRub(priceUsd * currentRate);
}

export function formatToRub(totalPriceRub: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(totalPriceRub);
}

export function getFormattedTimer(totalMs: number) {
    const totalSeconds = Math.max(0, totalMs / 1000);
    const seconds = Math.floor(totalSeconds);

    const centiseconds = Math.floor((totalMs % 1000) / 10);

    return {
        seconds: seconds.toString(),
        ms: centiseconds.toString().padStart(2, '0'),
        progress:  ((totalMs / 15000) * 100).toFixed(1)
    };
}