import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productService } from '../../api/products';
import { getErrorMessage } from '../../api/client';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    productService
      .list({ limit: 8 })
      .then((data) => {
        if (!ignore) setProducts(data.data || []);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border-soft">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ff3d68 0%, #ff8a3d 45%, transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
          <p className="font-mono-price text-xs uppercase tracking-[0.3em] text-muted">A marketplace, launched</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight text-star sm:text-6xl">
            Everything you need, at <span className="flare-text">supernova</span> speed
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted">
            Independent sellers, real inventory, fast checkout. Browse what just landed.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full flare-gradient px-6 py-3 text-sm font-medium text-ink"
          >
            Shop all products <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl text-star">Latest arrivals</h2>
          <Link to="/products" className="flare-underline text-sm text-muted">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton aspect-square rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="Couldn't load products" description={error} />
        ) : products.length === 0 ? (
          <EmptyState title="No products yet" description="Check back soon — new listings land here first." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
