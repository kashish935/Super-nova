import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { productService } from '../../api/products';
import { getErrorMessage } from '../../api/client';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';

const PAGE_SIZE = 12;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const minprice = searchParams.get('minprice') || '';
  const maxprice = searchParams.get('maxprice') || '';
  const page = Number(searchParams.get('page') || 1);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ minprice, maxprice });

  useEffect(() => {
    setPriceDraft({ minprice, maxprice });
  }, [minprice, maxprice]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    const params = { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
    if (q) params.q = q;
    if (minprice) params.minprice = minprice;
    if (maxprice) params.maxprice = maxprice;

    productService
      .list(params)
      .then((data) => !ignore && setProducts(data.data || []))
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [q, minprice, maxprice, page]);

  const applyFilters = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    priceDraft.minprice ? next.set('minprice', priceDraft.minprice) : next.delete('minprice');
    priceDraft.maxprice ? next.set('maxprice', priceDraft.maxprice) : next.delete('maxprice');
    next.set('page', '1');
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-star">{q ? `Results for "${q}"` : 'All products'}</h1>
          <p className="mt-1 text-sm text-muted">{loading ? 'Searching…' : `${products.length} shown`}</p>
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border-soft px-4 py-2 text-sm text-star hover:border-flare-hot/50"
        >
          <SlidersHorizontal size={14} /> Price
        </button>
      </div>

      {filtersOpen && (
        <form onSubmit={applyFilters} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border-soft bg-surface p-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Min price</label>
            <input
              type="number"
              min="0"
              value={priceDraft.minprice}
              onChange={(e) => setPriceDraft((d) => ({ ...d, minprice: e.target.value }))}
              className="w-28 rounded-md border border-border-soft bg-surface-raised px-3 py-1.5 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Max price</label>
            <input
              type="number"
              min="0"
              value={priceDraft.maxprice}
              onChange={(e) => setPriceDraft((d) => ({ ...d, maxprice: e.target.value }))}
              className="w-28 rounded-md border border-border-soft bg-surface-raised px-3 py-1.5 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
          </div>
          <button type="submit" className="rounded-full flare-gradient px-4 py-1.5 text-sm font-medium text-ink">
            Apply
          </button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Couldn't load products" description={error} />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" description="Try a different search or clear your filters." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="rounded-full border border-border-soft px-4 py-2 text-sm text-star disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-muted">Page {page}</span>
            <button
              disabled={products.length < PAGE_SIZE}
              onClick={() => goToPage(page + 1)}
              className="rounded-full border border-border-soft px-4 py-2 text-sm text-star disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
