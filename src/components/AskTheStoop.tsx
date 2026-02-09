'use client';

import { useState, FormEvent } from 'react';
import { Send, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AskTheStoop() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || status === 'sending') return;

    setStatus('sending');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('inbox')
        .insert({ message: message.trim() });

      if (error) throw error;

      setStatus('success');
      setMessage('');
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    } catch (err) {
      console.error('Error sending message:', err);
      setStatus('error');
      setErrorMessage('Failed to send. Please try again.');
      
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      {/* Community Board Card */}
      <div className="relative bg-amber-50/80 dark:bg-stone-800/80 rounded-2xl border-2 border-amber-200/80 dark:border-stone-600 shadow-lg overflow-hidden">
        
        {/* Decorative pushpins */}
        <div className="absolute top-3 left-4 w-3 h-3 bg-red-500 rounded-full shadow-md"></div>
        <div className="absolute top-3 right-4 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
        
        {/* Wood grain top border */}
        <div className="h-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700"></div>
        
        <div className="p-6 pt-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                Ask the Stoop
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Got a question? Drop us a note — no login required.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind? Ask a question, share feedback, or just say hey..."
                rows={3}
                maxLength={1000}
                disabled={status === 'sending' || status === 'success'}
                className="w-full px-4 py-3 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="absolute bottom-2 right-3 text-xs text-stone-400 dark:text-stone-500">
                {message.length}/1000
              </span>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={!message.trim() || status === 'sending' || status === 'success'}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white font-semibold rounded-full shadow-md transition-all disabled:cursor-not-allowed disabled:shadow-none"
              >
                {status === 'sending' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>

              {/* Status Messages */}
              {status === 'success' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium animate-in fade-in slide-in-from-right-4">
                  <CheckCircle className="w-4 h-4" />
                  Message sent to the stoop! 📬
                </div>
              )}
              
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-right-4">
                  <AlertCircle className="w-4 h-4" />
                  {errorMessage}
                </div>
              )}
            </div>
          </form>

          {/* Anonymous notice */}
          <p className="mt-4 text-xs text-stone-400 dark:text-stone-500 text-center">
            🔒 Your message is anonymous — no email or login required.
          </p>
        </div>
      </div>
    </section>
  );
}
