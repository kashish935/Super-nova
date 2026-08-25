import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Trash2, ImageOff, Plus } from 'lucide-react';
import { productService } from '../../api/products';
import { getErrorMessage } from '../../api/client';
import { formatPrice } from '../../utils/format';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    productService
      .getMine()
      .then((data) => setProducts(data.data || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await productService.remove(id);
      setProducts((p) => p.filter((prod) => prod._id !== id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-star">Your products</h1>
        <Link
          to="/seller/products/new"
          className="flex items-center gap-2 rounded-full flare-gradient px-4 py-2 text-sm font-medium text-ink"
        >
          <Plus size={16} /> Add product
        </Link>
      </div>

      {error ? (
        <EmptyState title="Couldn't load products" description={error} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product to start selling."
          action={
            <Link to="/seller/products/new" className="rounded-full flare-gradient px-5 py-2.5 text-sm font-medium text-ink">
              Add product
            </Link>
          }
        />
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft">
          {products.map((p) => (
            <div key={p._id} className="flex items-center gap-4 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-raised">
                {p.images?.[0]?.url ? (
                  <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <ImageOff size={16} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm text-star">{p.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatPrice(p.price)} · {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                </p>
              </div>
              <Link to={`/seller/products/${p._id}/edit`} className="text-muted hover:text-star">
                <Pencil size={16} />
              </Link>
              <button
                disabled={deletingId === p._id}
                onClick={() => handleDelete(p._id)}
                className="text-muted hover:text-flare-hot disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
