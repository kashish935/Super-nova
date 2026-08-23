import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product }) {
  const image = product.images?.[0]?.url;
  const outOfStock = (product.stock ?? 0) <= 0;

  return (
    <Link
      to={`/products/${product._id}`}
      className="group card-surface flex flex-col overflow-hidden rounded-lg transition-colors hover:border-flare-hot/50"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-raised">
        {image ? (
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff size={28} />
          </div>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm text-star">{product.title}</h3>
        <p className="font-mono-price mt-auto text-base text-star">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
