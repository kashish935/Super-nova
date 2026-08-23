import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cartService } from '../api/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user || user.role !== 'user') {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const data = await cartService.getCart();
      setCart(data.cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (productId, qty = 1) => {
    const { cart } = await cartService.addItem(productId, qty);
    setCart(cart);
  };

  const updateItem = async (productId, qty) => {
    const { cart } = await cartService.updateItem(productId, qty);
    setCart(cart);
  };

  const removeItem = async (productId) => {
    const { cart } = await cartService.removeItem(productId);
    setCart(cart);
  };

  const clearCart = async () => {
    const { cart } = await cartService.clearCart();
    setCart(cart);
  };

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, refreshCart, addItem, updateItem, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
