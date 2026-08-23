import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Package, PlusCircle, ClipboardList, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/seller/products', label: 'Products', icon: Package },
  { to: '/seller/products/new', label: 'Add product', icon: PlusCircle },
  { to: '/seller/orders', label: 'Orders', icon: ClipboardList },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function SellerLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-ink">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1b1b29', color: '#f5f3ff', border: '1px solid #26263a', fontSize: '14px' },
        }}
      />
      <aside className="hidden w-60 shrink-0 border-r border-border-soft p-5 md:block">
        <span className="font-display text-lg font-semibold text-star">
          Super<span className="flare-text">Nova</span>
        </span>
        <p className="mt-0.5 text-xs uppercase tracking-widest text-muted">Seller</p>

        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/seller/dashboard' || to === '/seller/products'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-surface-raised text-star' : 'text-muted hover:text-star'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-flare-hot hover:bg-surface-raised"
          >
            <LogOut size={16} /> Log out
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
