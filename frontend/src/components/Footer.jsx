import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border-soft">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="font-display text-lg font-semibold text-star">
              Super<span className="flare-text">Nova</span>
            </span>
            <p className="mt-2 max-w-xs text-sm text-muted">
              A marketplace for independent sellers, built for speed.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-muted">
            <Link to="/products" className="hover:text-star">Shop</Link>
            <Link to="/orders" className="hover:text-star">Orders</Link>
            <Link to="/seller/dashboard" className="hover:text-star">Sell on Super Nova</Link>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted">© {new Date().getFullYear()} Super Nova. All rights reserved.</p>
      </div>
    </footer>
  );
}
