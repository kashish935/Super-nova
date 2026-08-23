import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerService } from '../../api/seller';
import { getErrorMessage } from '../../api/client';
import { formatPrice, formatDate } from '../../utils/format';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';
import BackLink from '../../components/BackLink';

const statusColor = {
  PENDING: 'text-amber-400',
  CONFIRMED: 'text-sky-400',
  SHIPPED: 'text-sky-400',
  DELIVERED: 'text-success',
  CANCELLED: 'text-muted',
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    sellerService
      .getOrders()
      .then((data) => setOrders(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <BackLink to="/seller/dashboard" label="Dashboard" />
      <h1 className="font-display text-2xl text-star">Orders</h1>

      {error ? (
        <EmptyState title="Couldn't load orders" description={error} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Orders containing your products will show up here." />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {orders.map((order) => {
            const yourTotal = order.items.reduce((sum, i) => sum + i.price.amount * i.quantity, 0);
            const currency = order.items[0]?.price?.currency || 'INR';
            return (
              <Link
                to={`/seller/orders/${order._id}`}
                key={order._id}
                className="rounded-lg border border-border-soft p-4 transition-colors hover:border-flare-hot/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-star">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(order.createdAt)} · {order.user?.username ? `@${order.user.username}` : 'Buyer'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${statusColor[order.status] || 'text-muted'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-1 border-t border-border-soft pt-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted">Qty {item.quantity}</span>
                      <span className="font-mono-price text-star">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-3 text-sm">
                  <span className="text-muted">Your total</span>
                  <span className="font-mono-price text-star">{formatPrice({ amount: yourTotal, currency })}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
