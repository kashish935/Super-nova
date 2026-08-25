import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Pencil, X, Sun, Moon, MonitorSmartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../api/auth';
import { getErrorMessage } from '../../api/client';

const emptyAddress = { street: '', city: '', state: '', pincode: '', country: '' };

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: MonitorSmartphone },
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { preference, setTheme } = useTheme();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingAccount, setEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ username: '', email: '', firstName: '', lastName: '' });
  const [savingAccount, setSavingAccount] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setAccountForm({
        username: user.username || '',
        email: user.email || '',
        firstName: user.fullName?.firstName || '',
        lastName: user.fullName?.lastName || '',
      });
    }
  }, [user]);

  const loadAddresses = () => {
    authService
      .getAddresses()
      .then((data) => setAddresses(data.addresses || []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadAddresses, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.addAddress(form);
      toast.success('Address added');
      setForm(emptyAddress);
      setShowForm(false);
      loadAddresses();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await authService.deleteAddress(id);
      setAddresses((a) => a.filter((addr) => addr._id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      await authService.updateProfile({
        username: accountForm.username,
        email: accountForm.email,
        fullName: { firstName: accountForm.firstName, lastName: accountForm.lastName },
      });
      await refreshUser();
      toast.success('Profile updated');
      setEditingAccount(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await authService.updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setChangingPassword(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl text-star">Profile</h1>

      <div className="mt-6 rounded-lg border border-border-soft p-5">
        {!editingAccount ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm text-star">
                  {user?.fullName?.firstName} {user?.fullName?.lastName}
                </p>
                <p className="mt-1 break-words text-sm text-muted">{user?.email}</p>
                <p className="mt-1 break-words text-sm text-muted">@{user?.username}</p>
                <span className="mt-3 inline-block rounded-full border border-border-soft px-3 py-1 text-xs capitalize text-muted">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => setEditingAccount(true)}
                className="flex shrink-0 items-center gap-1.5 text-sm text-muted hover:text-star"
              >
                <Pencil size={14} /> Edit
              </button>
            </div>

            <div className="mt-5 border-t border-border-soft pt-4">
              {!changingPassword ? (
                <button onClick={() => setChangingPassword(true)} className="text-sm text-muted flare-underline">
                  Change password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm text-star">Change password</h3>
                    <button type="button" onClick={() => setChangingPassword(false)} className="text-muted hover:text-star">
                      <X size={16} />
                    </button>
                  </div>
                  <input
                    required
                    type="password"
                    placeholder="Current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
                  />
                  <input
                    required
                    type="password"
                    minLength={6}
                    placeholder="New password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                    className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="self-start rounded-full flare-gradient px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
                  >
                    {savingPassword ? 'Saving…' : 'Update password'}
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSaveAccount} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-star">Edit profile</h3>
              <button type="button" onClick={() => setEditingAccount(false)} className="text-muted hover:text-star">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="First name"
                value={accountForm.firstName}
                onChange={(e) => setAccountForm((f) => ({ ...f, firstName: e.target.value }))}
                className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
              />
              <input
                required
                placeholder="Last name"
                value={accountForm.lastName}
                onChange={(e) => setAccountForm((f) => ({ ...f, lastName: e.target.value }))}
                className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
              />
            </div>
            <input
              required
              placeholder="Username"
              value={accountForm.username}
              onChange={(e) => setAccountForm((f) => ({ ...f, username: e.target.value }))}
              className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={accountForm.email}
              onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-md border border-border-soft bg-surface px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={savingAccount}
              className="self-start rounded-full flare-gradient px-5 py-2 text-sm font-medium text-ink disabled:opacity-60"
            >
              {savingAccount ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg text-star">Appearance</h2>
        <p className="mt-1 text-sm text-muted">Choose how Super Nova looks on this device.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = preference === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={active}
                className={`flex min-w-[6rem] flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'border-flare-hot/60 bg-surface text-star'
                    : 'border-border-soft text-muted hover:border-flare-hot/40 hover:text-star'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-star">Saved addresses</h2>
          <button onClick={() => setShowForm((v) => !v)} className="text-sm text-muted flare-underline">
            {showForm ? 'Cancel' : '+ Add address'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 grid gap-3 rounded-lg border border-border-soft bg-surface p-4 sm:grid-cols-2">
            {['street', 'city', 'state', 'pincode', 'country'].map((field) => (
              <input
                key={field}
                required
                placeholder={field[0].toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className={`rounded-md border border-border-soft bg-surface-raised px-3 py-2 text-sm text-star focus:border-flare-hot/60 focus:outline-none ${
                  field === 'street' ? 'sm:col-span-2' : ''
                }`}
              />
            ))}
            <button
              type="submit"
              disabled={saving}
              className="sm:col-span-2 mt-1 rounded-full flare-gradient px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save address'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="skeleton h-16 rounded-lg" />
        ) : addresses.length === 0 ? (
          <p className="text-sm text-muted">No saved addresses yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((addr) => (
              <div key={addr._id} className="flex items-start justify-between gap-3 rounded-lg border border-border-soft p-4">
                <p className="min-w-0 break-words text-sm text-star">
                  {addr.street}, {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                </p>
                <button onClick={() => handleDelete(addr._id)} className="shrink-0 text-muted hover:text-flare-hot">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
