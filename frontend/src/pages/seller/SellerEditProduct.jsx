import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../../api/products';
import { getErrorMessage } from '../../api/client';
import PageLoader from '../../components/PageLoader';
import BackLink from '../../components/BackLink';

export default function SellerEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productService
      .getById(id)
      .then((data) => {
        const p = data.data;
        setForm({
          title: p.title,
          description: p.description || '',
          priceAmount: p.price.amount,
          priceCurrency: p.price.currency,
          stock: p.stock,
        });
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productService.update(id, {
        title: form.title,
        description: form.description,
        price: { amount: Number(form.priceAmount), currency: form.priceCurrency },
        stock: Number(form.stock),
      });
      toast.success('Product updated');
      navigate('/seller/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!form) return null;

  return (
    <div className="max-w-xl">
      <BackLink to="/seller/products" label="Products" />
      <h1 className="font-display text-2xl text-star">Edit product</h1>
      <p className="mt-1 text-xs text-muted">Images can't be changed after creation yet — delete and re-add to change photos.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Description</label>
          <textarea
            maxLength={500}
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm text-muted">Price</label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.priceAmount}
              onChange={(e) => setForm((f) => ({ ...f, priceAmount: e.target.value }))}
              className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted">Currency</label>
            <select
              value={form.priceCurrency}
              onChange={(e) => setForm((f) => ({ ...f, priceCurrency: e.target.value }))}
              className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Stock</label>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full flare-gradient px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
