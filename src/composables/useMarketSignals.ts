import {inject} from "vue";
import {PriceTrendKey, UsdRateKey} from "@/struct";

export function useMarketSignals() {
    const usdRate = inject(UsdRateKey);
    const priceTrend = inject(PriceTrendKey);

    if (!usdRate || !priceTrend) {
        throw new Error(
            'useMarketSignals(): usdRate/priceTrend не предоставлены'
        );
    }

    return {usdRate, priceTrend};
}