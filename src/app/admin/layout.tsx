'use client';

import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mic, LogOut, Home } from 'lucide-react';

function AdminNav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="bg-white border-b border-stone-200 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-xl font-bold text-stone-900">
            Stoop Politics
          </Link>
          <Link 
            href="/admin/episodes/new" 
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <Mic size={18} />
            <span>New Episode</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors text-sm"
          >
            <Home size={16} />
            <span>View Site</span>
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function AuthWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-stone-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <AdminNav onLogout={handleLogout} />
      <main className="max-w-5xl mx-auto py-8 px-6">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AuthWrapper>{children}</AuthWrapper>;
}