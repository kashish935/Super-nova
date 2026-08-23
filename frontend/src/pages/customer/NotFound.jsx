import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-display text-6xl flare-text">404</p>
      <h1 className="font-display text-xl text-star">Lost in space</h1>
      <p className="text-sm text-muted">This page doesn't exist.</p>
      <Link to="/" className="mt-4 rounded-full flare-gradient px-5 py-2.5 text-sm font-medium text-ink">
        Back home
      </Link>
    </div>
  );
}
