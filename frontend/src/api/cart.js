import { cartApi } from './client';

export const cartService = {
  getCart: () => cartApi.get('/api/cart').then((r) => r.data),
  addItem: (productId, qty = 1) => cartApi.post('/api/cart/items', { productId, qty }).then((r) => r.data),
  updateItem: (productId, qty) => cartApi.patch(`/api/cart/items/${productId}`, { qty }).then((r) => r.data),
  removeItem: (productId) => cartApi.delete(`/api/cart/items/${productId}`).then((r) => r.data),
  clearCart: () => cartApi.delete('/api/cart').then((r) => r.data),
};
