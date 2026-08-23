import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderService } from '../../api/orders';
import { productService } from '../../api/products';
import { getErrorMessage } from '../../api/client';
import { formatPrice, formatDate } from '../../utils/format';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';

const statusColor = {
  PENDING: 'text-amber-400',
  CONFIRMED: 'text-sky-400',
  SHIPPED: 'text-sky-400',
  DELIVERED: 'text-success',
  CANCELLED: 'text-muted',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = () => {
    setLoading(true);
    orderService
      .getById(id)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrder, [id]);

  useEffect(() => {
    if (!order?.items?.length) return;
    Promise.all(
      order.items.map((item) =>
        productService
          .getById(item.product)
          .then((res) => [item.product, res.data])
          .catch(() => [item.product, null])
      )
    ).then((pairs) => setProductMap(Object.fromEntries(pairs)));
  }, [order]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderService.cancel(id);
      toast.success('Order cancelled');
      loadOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState title="Order not found" description={error || 'This order could not be loaded.'} />
      </div>
    );
  }

  const { shippingAddress } = order;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/orders" className="text-sm text-muted flare-underline">
        ← My orders
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-star">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-sm font-medium ${statusColor[order.status] || 'text-muted'}`}>{order.status}</span>
      </div>

      <div className="mt-8 flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft">
        {order.items.map((item, i) => {
          const p = productMap[item.product];
          return (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-raised">
                {p?.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-star">{p?.title || 'Product'}</p>
                <p className="mt-1 text-xs text-muted">Qty {item.quantity}</p>
              </div>
              <p className="font-mono-price text-sm text-star">{formatPrice(item.price)}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-border-soft p-4">
          <h3 className="mb-2 text-sm font-medium text-star">Shipping address</h3>
          <p className="text-sm text-muted">
            {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode},{' '}
            {shippingAddress.country}
          </p>
        </div>
        <div className="rounded-lg border border-border-soft p-4">
          <h3 className="mb-2 text-sm font-medium text-star">Total</h3>
          <p className="font-mono-price text-lg text-star">{formatPrice(order.totalPrice)}</p>
        </div>
      </div>

      {order.status === 'PENDING' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="mt-6 rounded-full border border-flare-hot/60 px-5 py-2.5 text-sm text-flare-hot disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
    </div>
  );
}
