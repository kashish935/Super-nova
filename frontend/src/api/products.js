import { productApi } from './client';

export const productService = {
  // params: { q, minprice, maxprice, skip, limit }
  list: (params = {}) => productApi.get('/api/products', { params }).then((r) => r.data),
  getById: (id) => productApi.get(`/api/products/${id}`).then((r) => r.data),
  getMine: (params = {}) => productApi.get('/api/products/seller', { params }).then((r) => r.data),
  // formData fields: title, description, priceAmount, priceCurrency, stock, images (files, up to 5)
  create: (formData) =>
    productApi
      .post('/api/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  // payload can include: title, description, price: { amount, currency }, stock
  update: (id, payload) => productApi.patch(`/api/products/${id}`, payload).then((r) => r.data),
  remove: (id) => productApi.delete(`/api/products/${id}`).then((r) => r.data),
};
