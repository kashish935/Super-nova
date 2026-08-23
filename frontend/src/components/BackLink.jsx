import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackLink({ to, label = 'Back' }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-star">
      <ArrowLeft size={14} /> {label}
    </Link>
  );
}
