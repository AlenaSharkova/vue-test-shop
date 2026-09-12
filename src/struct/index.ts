import type {InjectionKey, Ref} from "vue";

export interface IGoodsResponse {
    Success: boolean;
    Error: string;
    Value: {
        Goods: IRawGood[];
    };
}

export interface IRawGood {
    G: number; // ID группы
    T: number; // ID товара
    C: number; // Цена в USD
    P: number; // Количество на складе
}
// Корневая структура всего файла names.json
export interface INamesDataResponse {
    [groupId: string]: INamesGroupItem;
}
//Структура одной категории внутри словаря имен names.json
export interface INamesGroupItem {
    G: string; // название категории
    B: {
        [productId: string]: INamesItemProduct; // Список товаров, ключ — ID товара
    };
    C?: number; //не используется во фронтенд
}
export interface INamesItemProduct {
    N: string;          // наименование товара
    T?: number | string; //не используется во фронтенд
}

// Внутренние структуры приложения
export interface ICatalogProduct {
    id: number;
    groupId: number;
    name: string;
    priceUsd: number;
    available: number;
    priceTrend?: 'up' | 'down' | null;
}

export interface ICatalogGroup {
    id: number;
    name: string;
    items: ICatalogProduct[];
}

export interface ICartEntry {
    id: number;       // ID товара (T) — уникален только вместе с groupId
    groupId: number;  // ID группы (G)
    quantity: number;
}

export interface ICartDisplayItem {
    id: number;
    groupId: number;
    name: string;
    categoryName: string;
    priceUsd: number;
    priceTrend?: 'up' | 'down' | null;
    available: number;
    quantity: number;
}

    export const UsdRateKey = Symbol() as InjectionKey<Ref<number>>;
