import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEmail = identifier.includes('@');
      const user = await login({
        [isEmail ? 'email' : 'username']: identifier,
        password,
      });
      toast.success(`Welcome back, ${user.fullName?.firstName || user.username}`);
      const redirectTo = location.state?.from?.pathname || (user.role === 'seller' ? '/seller/dashboard' : '/');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl text-star">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Log in to continue to Super Nova.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm text-muted">Email or username</label>
          <input
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted">Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full flare-gradient px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="text-star flare-underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
