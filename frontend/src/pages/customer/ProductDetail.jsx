import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ImageOff, Minus, Plus, ShoppingCart, Zap, Store, ZoomIn } from 'lucide-react';
import { productService } from '../../api/products';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import PageLoader from '../../components/PageLoader';
import EmptyState from '../../components/EmptyState';
import ImageLightbox from '../../components/ImageLightbox';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    productService
      .getById(id)
      .then((data) => !ignore && setProduct(data.data))
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <PageLoader />;
  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState title="Product not found" description={error || "This product doesn't exist or was removed."} />
      </div>
    );
  }

  const outOfStock = (product.stock ?? 0) <= 0;
  const images = product.images?.length ? product.images : [];

  const requireLogin = () => {
    toast.error('Log in to continue');
    navigate('/login', { state: { from: { pathname: `/products/${id}` } } });
  };

  const handleAddToCart = async () => {
    if (!user) return requireLogin();
    setBusy(true);
    try {
      await addItem(product._id, qty);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) return requireLogin();
    setBusy(true);
    try {
      await addItem(product._id, qty);
      navigate('/checkout');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <button
            type="button"
            onClick={() => images[activeImage] && setLightboxOpen(true)}
            className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border-soft bg-surface"
          >
            {images[activeImage] ? (
              <>
                <img
                  src={images[activeImage].url}
                  alt={product.title}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-xs text-star opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn size={14} /> Click to zoom
                </span>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted">
                <ImageOff size={40} />
              </div>
            )}
          </button>
          {images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => {
                    setActiveImage(i);
                    setLightboxOpen(true);
                  }}
                  className={`h-16 w-16 overflow-hidden rounded-md border ${
                    i === activeImage ? 'border-flare-hot' : 'border-border-soft'
                  }`}
                >
                  <img src={img.thumbnail || img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl text-star sm:text-3xl">{product.title}</h1>
          <p className="font-mono-price mt-3 text-3xl text-star">{formatPrice(product.price)}</p>

          <p className="mt-2 text-sm">
            {outOfStock ? (
              <span className="text-flare-hot">Out of stock</span>
            ) : (
              <span className="text-success">In stock{product.stock ? ` — ${product.stock} left` : ''}</span>
            )}
          </p>

          {product.description && <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>}

          {!outOfStock && user?.role !== 'seller' && (
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-border-soft">
                <button
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  className="p-2.5 text-star hover:text-flare-hot"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm text-star">{qty}</span>
                <button
                  onClick={() => setQty((v) => Math.min(product.stock || 99, v + 1))}
                  className="p-2.5 text-star hover:text-flare-hot"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {user?.role === 'seller' ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-border-soft bg-surface p-4 text-sm text-muted">
              <Store size={16} className="mt-0.5 shrink-0" />
              <span>You're signed in as a seller, so purchasing isn't available on this account.</span>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                disabled={outOfStock || busy}
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border-soft px-6 py-3 text-sm font-medium text-star hover:border-flare-hot/60 disabled:opacity-40"
              >
                <ShoppingCart size={16} /> Add to cart
              </button>
              <button
                disabled={outOfStock || busy}
                onClick={handleBuyNow}
                className="flex flex-1 items-center justify-center gap-2 rounded-full flare-gradient px-6 py-3 text-sm font-medium text-ink disabled:opacity-40"
              >
                <Zap size={16} /> Buy now
              </button>
            </div>
          )}

          <Link to="/products" className="mt-8 inline-block text-sm text-muted flare-underline">
            ← Back to shop
          </Link>
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          activeIndex={activeImage}
          onChangeIndex={setActiveImage}
          onClose={() => setLightboxOpen(false)}
          alt={product.title}
        />
      )}
    </div>
  );
}
