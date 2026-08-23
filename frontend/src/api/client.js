import axios from 'axios';

// Super Nova's backend is a set of independent microservices, each on its own port.
// Every client below shares the same config: cookies are sent (JWT is httpOnly),
// and a 401 anywhere signals the session expired.

function createClient(baseURL) {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        window.dispatchEvent(new CustomEvent('sn:unauthorized'));
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const authApi = createClient(import.meta.env.VITE_AUTH_API_URL);
export const productApi = createClient(import.meta.env.VITE_PRODUCT_API_URL);
export const cartApi = createClient(import.meta.env.VITE_CART_API_URL);
export const orderApi = createClient(import.meta.env.VITE_ORDER_API_URL);
export const paymentApi = createClient(import.meta.env.VITE_PAYMENT_API_URL);
export const sellerApi = createClient(import.meta.env.VITE_SELLER_API_URL);

// Normalizes axios/network errors into a message a user can read.
export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.errors?.[0]?.msg) return error.response.data.errors[0].msg;
  if (error.code === 'ERR_NETWORK') return "Can't reach the server right now. Check your connection and try again.";
  return 'Something went wrong. Please try again.';
}
