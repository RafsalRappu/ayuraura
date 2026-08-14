import { createContext, useContext } from "react";
import type { CartItem } from "../types/cart";

export interface CartContextValue {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
    setQuantity: (key: string, quantity: number) => void;
    removeItem: (key: string) => void;
    clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
