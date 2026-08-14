import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { CartItem } from "../types/cart";
import { cartItemKey } from "./cart";
import { CartContext } from "./useCart";

const STORAGE_KEY = "ayuraura:cart";

const loadStoredItems = (): CartItem[] => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch {
        return [];
    }
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
    const [items, setItems] = useState<CartItem[]>(loadStoredItems);

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = useCallback((item: Omit<CartItem, "key" | "quantity">, quantity = 1) => {
        setItems((current) => {
            const key = cartItemKey(item.slug, item.variantLabel);
            const existing = current.find((entry) => entry.key === key);

            if (existing) {
                return current.map((entry) =>
                    entry.key === key ? { ...entry, quantity: entry.quantity + quantity } : entry
                );
            }
            return [...current, { ...item, key, quantity }];
        });
    }, []);

    const setQuantity = useCallback((key: string, quantity: number) => {
        setItems((current) => {
            if (quantity <= 0) return current.filter((entry) => entry.key !== key);
            return current.map((entry) => (entry.key === key ? { ...entry, quantity } : entry));
        });
    }, []);

    const removeItem = useCallback((key: string) => {
        setItems((current) => current.filter((entry) => entry.key !== key));
    }, []);

    const clear = useCallback(() => setItems([]), []);

    const value = useMemo(
        () => ({ items, addItem, setQuantity, removeItem, clear }),
        [items, addItem, setQuantity, removeItem, clear]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
