import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sellerService } from '../../api/seller';
import { productService } from '../../api/products';
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

export default function SellerOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    sellerService
      .getOrderById(id)
      .then((data) => setOrder(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <PageLoader />;
  if (error || !order) {
    return (
      <div>
        <BackLink to="/seller/orders" label="Orders" />
        <EmptyState title="Order not found" description={error || 'This order could not be loaded.'} />
      </div>
    );
  }

  const { shippingAddress } = order;
  const yourTotal = order.items.reduce((sum, i) => sum + i.price.amount * i.quantity, 0);
  const currency = order.items[0]?.price?.currency || 'INR';

  return (
    <div>
      <BackLink to="/seller/orders" label="Orders" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-star">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted">
            {formatDate(order.createdAt)} · {order.user?.username ? `@${order.user.username}` : 'Buyer'}
          </p>
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
          <h3 className="mb-2 text-sm font-medium text-star">Your total</h3>
          <p className="font-mono-price text-lg text-star">{formatPrice({ amount: yourTotal, currency })}</p>
          <p className="mt-1 text-xs text-muted">Only your items are counted — not the full order total.</p>
        </div>
      </div>
    </div>
  );
}
