import { authApi } from './client';

export const authService = {
  register: (payload) => authApi.post('/api/auth/register', payload).then((r) => r.data),
  login: (payload) => authApi.post('/api/auth/login', payload).then((r) => r.data),
  logout: () => authApi.get('/api/auth/logout').then((r) => r.data),
  getCurrentUser: () => authApi.get('/api/auth/me').then((r) => r.data),
  getAddresses: () => authApi.get('/api/auth/users/me/addresses').then((r) => r.data),
  addAddress: (payload) => authApi.post('/api/auth/users/me/addresses', payload).then((r) => r.data),
  deleteAddress: (addressId) => authApi.delete(`/api/auth/users/me/addresses/${addressId}`).then((r) => r.data),
  // payload can include any of: username, email, fullName: { firstName, lastName }, currentPassword, newPassword
  updateProfile: (payload) => authApi.patch('/api/auth/me', payload).then((r) => r.data),
};
