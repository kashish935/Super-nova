import { sellerApi } from './client';

export const sellerService = {
  getMetrics: () => sellerApi.get('/api/seller/dashboard/metrics').then((r) => r.data),
  getOrders: () => sellerApi.get('/api/seller/dashboard/orders').then((r) => r.data),
  getOrderById: (id) => sellerApi.get(`/api/seller/dashboard/orders/${id}`).then((r) => r.data),
  getProducts: () => sellerApi.get('/api/seller/dashboard/products').then((r) => r.data),
};
