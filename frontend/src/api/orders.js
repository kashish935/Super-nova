import { orderApi } from './client';

export const orderService = {
  create: (shippingAddress) => orderApi.post('/api/orders', { shippingAddress }).then((r) => r.data),
  getMine: (params = {}) => orderApi.get('/api/orders/me', { params }).then((r) => r.data),
  getById: (id) => orderApi.get(`/api/orders/${id}`).then((r) => r.data),
  cancel: (id) => orderApi.post(`/api/orders/${id}/cancel`).then((r) => r.data),
  updateAddress: (id, shippingAddress) =>
    orderApi.patch(`/api/orders/${id}/address`, { shippingAddress }).then((r) => r.data),
};
