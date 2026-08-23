import { paymentApi } from './client';

export const paymentService = {
  createPayment: (orderId) => paymentApi.post(`/api/payments/create/${orderId}`).then((r) => r.data),
  verifyPayment: (payload) => paymentApi.post('/api/payments/verify', payload).then((r) => r.data),
};
