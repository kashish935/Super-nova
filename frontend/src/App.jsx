import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './routes/ProtectedRoute';

import MainLayout from './layouts/MainLayout';
import SellerLayout from './layouts/SellerLayout';

import Home from './pages/customer/Home';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import Products from './pages/customer/Products';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import OrderDetail from './pages/customer/OrderDetail';
import Profile from './pages/customer/Profile';
import NotFound from './pages/customer/NotFound';

import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerAddProduct from './pages/seller/SellerAddProduct';
import SellerEditProduct from './pages/seller/SellerEditProduct';
import SellerOrders from './pages/seller/SellerOrders';
import SellerOrderDetail from './pages/seller/SellerOrderDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute role="user">
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute role="user">
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute role="user">
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route
              path="/seller"
              element={
                <ProtectedRoute role="seller">
                  <SellerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="products/new" element={<SellerAddProduct />} />
              <Route path="products/:id/edit" element={<SellerEditProduct />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="orders/:id" element={<SellerOrderDetail />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
