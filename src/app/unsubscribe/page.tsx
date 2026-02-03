'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, XCircle, Bell, BellOff } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'unsubscribe' | 'resubscribe'>('unsubscribe');

  const handleUnsubscribe = useCallback(async () => {
    if (!email) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, enabled: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unsubscribe');
      }

      setSuccess(true);
      setAction('unsubscribe');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (email) {
      handleUnsubscribe();
    } else {
      setLoading(false);
      setError('No email address provided');
    }
  }, [email, handleUnsubscribe]);

  const handleResubscribe = async () => {
    if (!email) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, enabled: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resubscribe');
      }

      setSuccess(true);
      setAction('resubscribe');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-serif font-black text-stone-900">
            Stoop<span className="text-orange-600">Politics</span>
          </Link>
          <p className="text-stone-400 text-sm italic mt-1">Watch your step</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 text-center">
          {loading ? (
            <>
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-stone-600">Processing your request...</p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-stone-900 mb-2">Oops!</h1>
              <p className="text-stone-600 mb-6">{error}</p>
              <Link 
                href="/"
                className="inline-block bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                Back to the Stoop
              </Link>
            </>
          ) : success && action === 'unsubscribe' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BellOff className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-stone-900 mb-2">
                You&apos;ve been unsubscribed
              </h1>
              <p className="text-stone-600 mb-6">
                You won&apos;t receive any more email notifications from us.
                You can still visit the stoop anytime.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/"
                  className="block bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
                >
                  Back to the Stoop
                </Link>
                <button
                  onClick={handleResubscribe}
                  className="block w-full text-orange-600 hover:text-orange-700 font-medium py-2 transition-colors"
                >
                  Changed your mind? Resubscribe →
                </button>
              </div>
            </>
          ) : success && action === 'resubscribe' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-stone-900 mb-2">
                Welcome back!
              </h1>
              <p className="text-stone-600 mb-6">
                You&apos;re now subscribed to receive notifications when new episodes drop.
              </p>
              <Link 
                href="/"
                className="inline-block bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
              >
                Back to the Stoop
              </Link>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <p className="text-center text-stone-400 text-sm mt-6">
          🏙️ Live from Manhattan
        </p>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-600">Loading...</p>
        </div>
      </main>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
