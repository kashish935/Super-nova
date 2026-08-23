import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ClipboardList, TrendingUp, ShoppingBag } from 'lucide-react';
import { sellerService } from '../../api/seller';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/format';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';

export default function SellerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([sellerService.getMetrics(), sellerService.getOrders(), sellerService.getProducts()])
      .then(([m, o, p]) => {
        setMetrics(m);
        setOrders(o);
        setProductCount(p.length);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <EmptyState title="Couldn't load dashboard" description={error} />;

  const cards = [
    { label: 'Products', value: productCount, icon: Package },
    { label: 'Orders', value: orders.length, icon: ClipboardList },
    { label: 'Units sold', value: metrics?.sales ?? 0, icon: ShoppingBag },
    { label: 'Revenue', value: `₹${(metrics?.revenue ?? 0).toLocaleString('en-IN')}`, icon: TrendingUp },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-star">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-surface rounded-lg p-4">
            <Icon size={18} className="text-flare-hot" />
            <p className="font-mono-price mt-3 text-2xl text-star">{value}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg text-star">Top products</h2>
          {metrics?.topProducts?.length ? (
            <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft">
              {metrics.topProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 text-sm">
                  <span className="text-star">{p.title}</span>
                  <span className="text-muted">{p.sold} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No sales yet.</p>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-star">Recent orders</h2>
            <Link to="/seller/orders" className="text-sm text-muted flare-underline">
              View all
            </Link>
          </div>
          {orders.length ? (
            <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft">
              {orders.slice(0, 5).map((o) => (
                <Link
                  to={`/seller/orders/${o._id}`}
                  key={o._id}
                  className="flex items-center justify-between p-3 text-sm hover:bg-surface"
                >
                  <div>
                    <p className="text-star">#{o._id.slice(-8).toUpperCase()}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <span className="text-xs text-muted">{o.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
