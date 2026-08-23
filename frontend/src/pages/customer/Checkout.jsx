import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/auth';
import { orderService } from '../../api/orders';
import { paymentService } from '../../api/payments';
import { getErrorMessage } from '../../api/client';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const emptyAddress = { street: '', city: '', state: '', pincode: '', country: '' };

export default function Checkout() {
  const { cart, loading: cartLoading, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    authService
      .getAddresses()
      .then((data) => {
        setAddresses(data.addresses || []);
        if (data.addresses?.length) setSelectedId(data.addresses[0]._id);
        else setAddingNew(true);
      })
      .catch(() => setAddingNew(true));
  }, []);

  if (cartLoading) return <PageLoader />;
  if (!cart?.items?.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState title="Your cart is empty" description="Add something to your cart before checking out." />
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPlacingOrder(true);

    const shippingAddress = addingNew
      ? form
      : (() => {
          const a = addresses.find((addr) => addr._id === selectedId);
          return a ? { street: a.street, city: a.city, state: a.state, pincode: a.pincode, country: a.country } : null;
        })();

    if (!shippingAddress) {
      toast.error('Select or enter a shipping address');
      setPlacingOrder(false);
      return;
    }

    try {
      // 1. Save new address for next time, if applicable — best-effort, doesn't block checkout.
      if (addingNew) {
        authService.addAddress(shippingAddress).catch(() => {});
      }

      // 2. Create the order from the current cart.
      const { order } = await orderService.create(shippingAddress);

      // 3. Create a Razorpay payment for that order.
      const { payment } = await paymentService.createPayment(order._id);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error('Could not load payment gateway. Please try again.');
        setPlacingOrder(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: payment.price.amount,
        currency: payment.price.currency,
        order_id: payment.razorpayOrderId,
        name: 'Super Nova',
        description: `Order #${order._id.slice(-6)}`,
        prefill: {
          name: `${user?.fullName?.firstName || ''} ${user?.fullName?.lastName || ''}`.trim(),
          email: user?.email,
        },
        theme: { color: '#ff3d68' },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await clearCart();
            toast.success('Payment successful — order placed!');
            navigate(`/orders/${order._id}`);
          } catch (err) {
            toast.error(getErrorMessage(err));
            navigate(`/orders/${order._id}`);
          }
        },
        modal: {
          ondismiss: () => setPlacingOrder(false),
        },
      });

      razorpay.open();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPlacingOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl text-star">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="mt-8">
        <h2 className="mb-3 font-display text-lg text-star">Shipping address</h2>

        {addresses.length > 0 && (
          <div className="mb-4 flex flex-col gap-3">
            {addresses.map((addr) => (
              <label
                key={addr._id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm ${
                  !addingNew && selectedId === addr._id ? 'border-flare-hot' : 'border-border-soft'
                }`}
              >
                <input
                  type="radio"
                  checked={!addingNew && selectedId === addr._id}
                  onChange={() => {
                    setSelectedId(addr._id);
                    setAddingNew(false);
                  }}
                  className="mt-1"
                />
                <span className="text-star">
                  {addr.street}, {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                </span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="self-start text-sm text-muted flare-underline"
            >
              + Use a new address
            </button>
          </div>
        )}

        {addingNew && (
          <div className="grid gap-3 rounded-lg border border-border-soft bg-surface p-4 sm:grid-cols-2">
            <input
              required
              placeholder="Street"
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              className="col-span-2 rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
            <input
              required
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className="rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
            <input
              required
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              className="rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
            <input
              required
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={placingOrder}
          className="mt-6 w-full rounded-full flare-gradient px-4 py-3 text-sm font-medium text-ink disabled:opacity-60"
        >
          {placingOrder ? 'Processing…' : 'Place order & pay'}
        </button>
      </form>
    </div>
  );
}
