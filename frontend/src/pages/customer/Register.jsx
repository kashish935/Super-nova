import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await register({
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: { firstName: form.firstName, lastName: form.lastName },
        role: form.role,
      });
      toast.success(`Account created — welcome, ${user.fullName?.firstName}`);
      navigate(user.role === 'seller' ? '/seller/dashboard' : '/', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl text-star">Create your account</h1>
      <p className="mt-2 text-sm text-muted">Join Super Nova as a shopper or a seller.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm text-muted">First name</label>
            <input
              required
              value={form.firstName}
              onChange={update('firstName')}
              className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted">Last name</label>
            <input
              required
              value={form.lastName}
              onChange={update('lastName')}
              className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Username</label>
          <input
            required
            minLength={3}
            value={form.username}
            onChange={update('username')}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={update('email')}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={update('password')}
            className="w-full rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-star focus:border-flare-hot/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted">I'm signing up as</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'user', label: 'A shopper' },
              { value: 'seller', label: 'A seller' },
            ].map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
                className={`rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                  form.role === opt.value
                    ? 'border-flare-hot bg-surface-raised text-star'
                    : 'border-border-soft text-muted hover:text-star'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full flare-gradient px-4 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-star flare-underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
