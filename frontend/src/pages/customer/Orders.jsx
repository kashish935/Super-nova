import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../api/orders';
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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    orderService
      .getMine()
      .then((data) => setOrders(data.orders || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl text-star">My orders</h1>

      {error ? (
        <EmptyState title="Couldn't load orders" description={error} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders you place will show up here."
          action={
            <Link to="/products" className="rounded-full flare-gradient px-5 py-2.5 text-sm font-medium text-ink">
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-surface"
            >
              <div>
                <p className="text-sm text-star">Order #{order._id.slice(-8).toUpperCase()}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono-price text-sm text-star">{formatPrice(order.totalPrice)}</p>
                <p className={`mt-1 text-xs font-medium ${statusColor[order.status] || 'text-muted'}`}>
                  {order.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
