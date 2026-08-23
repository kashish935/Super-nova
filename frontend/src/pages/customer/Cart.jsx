import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Minus, Plus, Trash2, ImageOff } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../api/products';
import { getErrorMessage } from '../../api/client';
import { formatPrice } from '../../utils/format';
import EmptyState from '../../components/EmptyState';
import PageLoader from '../../components/PageLoader';

export default function Cart() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [productMap, setProductMap] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [mutatingId, setMutatingId] = useState(null);

  useEffect(() => {
    if (!cart?.items?.length) {
      setProductMap({});
      setLoadingDetails(false);
      return;
    }
    let ignore = false;
    setLoadingDetails(true);
    Promise.all(
      cart.items.map((item) =>
        productService
          .getById(item.productId)
          .then((res) => [item.productId, res.data])
          .catch(() => [item.productId, null])
      )
    ).then((pairs) => {
      if (ignore) return;
      setProductMap(Object.fromEntries(pairs));
      setLoadingDetails(false);
    });
    return () => {
      ignore = true;
    };
  }, [cart]);

  const handleQty = async (productId, qty) => {
    if (qty < 1) return;
    setMutatingId(productId);
    try {
      await updateItem(productId, qty);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  };

  const handleRemove = async (productId) => {
    setMutatingId(productId);
    try {
      await removeItem(productId);
      toast.success('Removed from cart');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  };

  if (user?.role === 'seller') {
    return <Navigate to="/seller/dashboard" replace />;
  }

  if (loading) return <PageLoader />;

  if (!cart?.items?.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Your cart is empty"
          description="Products you add will show up here."
          action={
            <Link to="/products" className="rounded-full flare-gradient px-5 py-2.5 text-sm font-medium text-ink">
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const p = productMap[item.productId];
    return sum + (p ? p.price.amount * item.quantity : 0);
  }, 0);
  const currency = Object.values(productMap).find(Boolean)?.price?.currency || 'INR';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl text-star">Your cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft">
            {cart.items.map((item) => {
              const p = productMap[item.productId];
              const busy = mutatingId === item.productId;
              return (
                <div key={item.productId} className="flex gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-raised">
                    {loadingDetails ? (
                      <div className="skeleton h-full w-full" />
                    ) : p?.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted">
                        <ImageOff size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/products/${item.productId}`} className="text-sm text-star hover:text-flare-hot">
                        {loadingDetails ? '…' : p?.title || 'Product unavailable'}
                      </Link>
                      <button
                        disabled={busy}
                        onClick={() => handleRemove(item.productId)}
                        className="text-muted hover:text-flare-hot disabled:opacity-40"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border-soft">
                        <button
                          disabled={busy}
                          onClick={() => handleQty(item.productId, item.quantity - 1)}
                          className="p-2 text-star hover:text-flare-hot disabled:opacity-40"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm text-star">{item.quantity}</span>
                        <button
                          disabled={busy}
                          onClick={() => handleQty(item.productId, item.quantity + 1)}
                          className="p-2 text-star hover:text-flare-hot disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="font-mono-price text-sm text-star">
                        {p ? formatPrice({ amount: p.price.amount * item.quantity, currency: p.price.currency }) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-fit rounded-lg border border-border-soft bg-surface p-5">
          <h2 className="font-display text-lg text-star">Summary</h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-mono-price text-star">{formatPrice({ amount: subtotal, currency })}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Shipping and taxes calculated at checkout.</p>
          <button
            onClick={() => navigate('/checkout')}
            className="mt-5 w-full rounded-full flare-gradient px-4 py-3 text-sm font-medium text-ink"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
