import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../../api/products';
import { getErrorMessage } from '../../api/client';
import BackLink from '../../components/BackLink';

export default function SellerAddProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', priceAmount: '', priceCurrency: 'INR', stock: '' });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (e) => {
    setImages(Array.from(e.target.files).slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('priceAmount', form.priceAmount);
      formData.append('priceCurrency', form.priceCurrency);
      formData.append('stock', form.stock || '0');
      images.forEach((file) => formData.append('images', file));

      await productService.create(formData);
      toast.success('Product created');
      navigate('/seller/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <BackLink to="/seller/products" label="Products" />
      <h1 className="font-display text-2xl text-star">Add a product</h1>

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

        <div>
          <label className="mb-1.5 block text-sm text-muted">Images (up to 5)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-sm text-star file:mr-3 file:rounded-full file:border-0 file:bg-surface-raised file:px-3 file:py-1.5 file:text-star"
          />
          {images.length > 0 && <p className="mt-1 text-xs text-muted">{images.length} file(s) selected</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full flare-gradient px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create product'}
        </button>
      </form>
    </div>
  );
}
