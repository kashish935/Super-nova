import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Package, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSeller = user?.role === 'seller';

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display text-xl font-semibold tracking-tight text-star">
            Super<span className="flare-text">Nova</span>
          </span>
        </Link>

        {/* Shopping search only makes sense for shoppers — sellers can't buy, so it's just noise for them. */}
        {!isSeller && (
          <form onSubmit={handleSearch} className="hidden flex-1 items-center md:flex">
            <div className="flex w-full max-w-lg items-center gap-2 rounded-full border border-border-soft bg-surface px-4 py-2 focus-within:border-flare-hot/60">
              <Search size={16} className="text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm text-star placeholder:text-muted focus:outline-none"
              />
            </div>
          </form>
        )}

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {isSeller ? (
            <Link to="/seller/dashboard" className="flex items-center gap-2 text-sm text-star/90 flare-underline">
              <LayoutDashboard size={16} /> Seller dashboard
            </Link>
          ) : (
            <>
              <Link to="/products" className="flare-underline text-sm text-star/90">
                Shop
              </Link>

              <Link to="/cart" className="relative flex items-center text-star/90">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-flare-hot text-[10px] font-semibold text-ink">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border-soft px-3 py-1.5 text-sm text-star hover:border-flare-hot/50"
              >
                <User size={16} />
                {user.fullName?.firstName || user.username}
              </button>
              {menuOpen && (
                <div
                  onMouseLeave={() => setMenuOpen(false)}
                  className="absolute right-0 mt-2 w-48 rounded-lg border border-border-soft bg-surface-raised py-1 shadow-xl"
                >
                  {isSeller ? (
                    <Link
                      to="/seller/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-star hover:bg-surface"
                    >
                      <LayoutDashboard size={14} /> Seller dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-star hover:bg-surface"
                    >
                      <Package size={14} /> My orders
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-star hover:bg-surface"
                  >
                    <User size={14} /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-flare-hot hover:bg-surface"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-star/90 flare-underline">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full flare-gradient px-4 py-1.5 text-sm font-medium text-ink"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>

        <button className="ml-auto md:hidden text-star" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border-soft px-4 py-4 md:hidden">
          {!isSeller && (
            <form onSubmit={handleSearch} className="mb-4 flex items-center gap-2 rounded-full border border-border-soft bg-surface px-4 py-2">
              <Search size={16} className="text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm text-star placeholder:text-muted focus:outline-none"
              />
            </form>
          )}
          <div className="flex flex-col gap-3 text-sm">
            {isSeller ? (
              <Link to="/seller/dashboard" onClick={() => setMobileOpen(false)} className="text-star">Seller dashboard</Link>
            ) : (
              <>
                <Link to="/products" onClick={() => setMobileOpen(false)} className="text-star">Shop</Link>
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-star">Cart ({itemCount})</Link>
              </>
            )}
            {user ? (
              <>
                {!isSeller && (
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="text-star">My orders</Link>
                )}
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-star">Profile</Link>
                <button onClick={handleLogout} className="text-left text-flare-hot">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-star">Log in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-star">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
