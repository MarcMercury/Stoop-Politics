'use client';

import { useState } from 'react';
import { Loader2, Mail, Bell, CheckCircle } from 'lucide-react';

interface StoopGateProps {
  onSubscribed: () => void;
}

export default function StoopGate({ onSubscribed }: StoopGateProps) {
  const [email, setEmail] = useState('');
  const [notifyMe, setNotifyMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, notifyMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      // Set cookie to remember subscription (1 year expiry)
      document.cookie = `stoop_subscriber=true; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`;
      
      setSuccess(true);
      
      // Refresh after showing success message
      setTimeout(() => {
        onSubscribed();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-black text-white mb-2">
            Stoop<span className="text-orange-500">Politics</span>
          </h1>
          <p className="text-stone-400 text-sm italic">Watch your step</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-orange-900 p-6 text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="/jessie-stoop.png" 
                alt="Jessie Mercury"
                className="w-14 h-14 rounded-full object-cover object-top border-2 border-orange-500"
              />
            </div>
            <h2 className="text-xl font-bold text-white">
              You must subscribe to sit on the stoop
            </h2>
            <p className="text-stone-400 text-sm mt-2">
              Get access to all episodes, transcripts, and more
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">
                  Welcome to the Stoop!
                </h3>
                <p className="text-stone-600 text-sm">
                  Refreshing the page...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-stone-900 placeholder:text-stone-400"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Notification Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={notifyMe}
                      onChange={(e) => setNotifyMe(e.target.checked)}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className={`w-5 h-5 border-2 rounded transition-colors ${
                      notifyMe 
                        ? 'bg-orange-500 border-orange-500' 
                        : 'border-stone-300 group-hover:border-orange-400'
                    }`}>
                      {notifyMe && (
                        <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-stone-700 flex items-center gap-1">
                      <Bell className="w-4 h-4" />
                      Notify me when new episodes drop
                    </span>
                    <span className="text-xs text-stone-500 block mt-0.5">
                      Get an email each time there&apos;s a new broadcast
                    </span>
                  </div>
                </label>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    'Subscribe & Enter the Stoop'
                  )}
                </button>

                {/* Privacy Note */}
                <p className="text-xs text-stone-400 text-center">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* NYC Vibes */}
        <p className="text-center text-stone-500 text-sm mt-6">
          🏙️ Live from Manhattan
        </p>
      </div>
    </div>
  );
}
