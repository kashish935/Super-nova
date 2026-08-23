import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1b1b29',
            color: '#f5f3ff',
            border: '1px solid #26263a',
            fontSize: '14px',
          },
        }}
      />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
