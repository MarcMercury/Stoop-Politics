'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, User, Bell, BellOff, Loader2 } from 'lucide-react';
import TranscriptPlayer from './TranscriptPlayer';
import AskTheStoop from './AskTheStoop';
import StoopGate from './StoopGate';
import { StoopModeProvider, useTimeOfDay, themeClasses } from './StoopMode';

interface Episode {
  id: string;
  title: string;
  summary?: string;
  audio_url: string;
  cover_image_url?: string;
  is_published: boolean;
  published_at: string;
  duration_seconds?: number;
}

interface TranscriptNode {
  id: string;
  content: string;
  start_time: number | null;
  end_time: number | null;
  reference_link?: string;
  reference_title?: string;
  display_order: number;
}

interface HomePageClientProps {
  latestEpisode: Episode;
  previousEpisodes: Episode[];
  transcript: TranscriptNode[];
}

function HomePageContent({ latestEpisode, previousEpisodes, transcript }: HomePageClientProps) {
  const timeOfDay = useTimeOfDay();
  const [mounted, setMounted] = useState(false);
  const [showGate, setShowGate] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for subscription cookie
    const hasSubscribed = document.cookie.includes('stoop_subscriber=true');
    setShowGate(!hasSubscribed);
  }, []);

  const handleSubscribed = () => {
    setShowGate(false);
  };

  const handleNotificationOptIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationEmail || !notificationEmail.includes('@')) return;
    
    setNotificationLoading(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notificationEmail, enabled: true }),
      });
      
      if (response.ok) {
        setNotificationSuccess(true);
        setTimeout(() => {
          setShowNotificationModal(false);
          setNotificationSuccess(false);
          setNotificationEmail('');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to opt in:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  // Use afternoon theme during SSR, then switch to actual theme after mount
  const theme = themeClasses[mounted ? timeOfDay : 'afternoon'];
  const isEvening = mounted && timeOfDay === 'evening';

  // Show gate if not subscribed
  if (mounted && showGate) {
    return <StoopGate onSubscribed={handleSubscribed} />;
  }

  return (
    <main className={`min-h-screen font-sans ${theme.main} transition-colors duration-500`}>
      
      {/* ===== STICKY NAVIGATION BAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-sm ${theme.nav} transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          
          {/* Logo with evening glow */}
          <Link 
            href="/" 
            className={`text-xl font-serif font-bold hover:opacity-80 transition-opacity stoop-logo ${isEvening ? 'text-slate-100' : 'text-stone-900'}`}
          >
            Stoop<span className="text-orange-600">Politics</span>
          </Link>
          
          {/* Right Side: Archive + Login */}
          <div className="flex items-center gap-6">
            
            {/* Archive Dropdown */}
            {previousEpisodes.length > 0 && (
              <div className="relative group">
                <button className={`flex items-center gap-1 text-sm font-medium transition-colors ${isEvening ? 'text-slate-400 hover:text-slate-200' : 'text-stone-600 hover:text-stone-900'}`}>
                  Previous Episodes
                  <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>
                
                {/* Dropdown Menu */}
                <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden ${isEvening ? 'bg-slate-800 border-slate-700' : 'bg-white border-stone-200'}`}>
                  <div className="py-2">
                    {previousEpisodes.map((ep) => (
                      <Link 
                        key={ep.id}
                        href={'/?episode=' + ep.id}
                        className={`block px-4 py-3 text-sm hover:text-orange-500 transition-colors border-b last:border-0 ${isEvening ? 'text-slate-300 border-slate-700 hover:bg-slate-700' : 'text-stone-700 border-stone-100 hover:bg-stone-50'}`}
                      >
                        <span className="font-medium line-clamp-1">{ep.title}</span>
                        <span className={`text-xs block mt-0.5 ${isEvening ? 'text-slate-500' : 'text-stone-400'}`}>
                          {new Date(ep.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Admin Login Link */}
            <Link 
              href="/login" 
              className={`transition-colors ${isEvening ? 'text-slate-500 hover:text-slate-200' : 'text-stone-400 hover:text-stone-900'}`}
              title="Admin Login"
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Spacer for fixed nav */}
      <div className="h-16"></div>

      {/* ===== HERO BANNER - JESSIE MERCURY ===== */}
      <div className="relative w-full bg-gradient-to-r from-stone-900 via-stone-800 to-orange-900 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 py-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-1">🎙️ The Digital Stoop</p>
              <h1 className="text-3xl md:text-4xl font-serif font-black text-white stoop-logo">
                Jessie Mercury
              </h1>
              <p className="text-stone-400 text-sm mt-1 italic">Watch your step</p>
            </div>
            {/* Jessie illustration */}
            <div className="hidden md:block w-20 h-20 rounded-full overflow-hidden border-2 border-orange-500 shadow-lg">
              <img 
                src="/jessie-stoop.png" 
                alt="Jessie Mercury"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== HERO IMAGE - NYC STOOP VIBES ===== */}
      <header className="relative max-w-5xl mx-auto px-6 pt-8 pb-8">
        
        {/* Main Hero Image - Iconic NYC Stoop Scene */}
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl mb-10 bg-stone-800 group cursor-pointer">
          {/* Cover image */}
          <img 
            src={latestEpisode.cover_image_url || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?q=80&w=2000&auto=format&fit=crop"}
            alt="NYC Stoop Scene"
            className="object-cover w-full h-full grayscale group-hover:grayscale-[50%] transition-all duration-700 ease-out scale-100 group-hover:scale-105"
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 to-transparent"></div>
          
          {/* Live badge with time-based styling */}
          <div className={`absolute top-4 right-4 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isEvening ? 'bg-slate-900/60' : 'bg-black/40'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isEvening ? 'bg-orange-400' : 'bg-yellow-400'}`}></span>
            {isEvening ? 'Night Edition' : 'Live from Manhattan'}
          </div>
          
          {/* Episode Title Overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="inline-flex items-center gap-2 bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-3 shadow-lg">
              <span className="animate-pulse w-2 h-2 bg-white rounded-full"></span>
              Latest Broadcast
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white drop-shadow-lg mb-2">
              {latestEpisode.title}
            </h2>
            <p className="text-stone-300 text-sm">
              {new Date(latestEpisode.published_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        {latestEpisode.summary && (
          <div className={`rounded-xl p-6 shadow-lg border mb-6 relative overflow-hidden ${isEvening ? 'bg-slate-800 border-slate-700' : 'bg-white border-stone-200'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-orange-600"></div>
            <p className={`text-lg leading-relaxed pl-4 italic ${isEvening ? 'text-slate-300' : 'text-stone-700'}`}>
              &ldquo;{latestEpisode.summary}&rdquo;
            </p>
          </div>
        )}
      </header>

      {/* ===== INTERACTIVE TRANSCRIPT PLAYER ===== */}
      <TranscriptPlayer 
        audioUrl={latestEpisode.audio_url}
        transcriptNodes={transcript}
        episodeTitle={latestEpisode.title}
        isCollapsed={!transcriptExpanded}
        onToggleCollapse={() => setTranscriptExpanded(!transcriptExpanded)}
      />

      {/* ===== PREVIOUS EPISODES ARCHIVE ===== */}
      {previousEpisodes.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <details className="group">
            <summary className={`flex items-center justify-between cursor-pointer list-none py-4 border-t ${isEvening ? 'border-slate-700' : 'border-stone-200'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${isEvening ? 'text-slate-500' : 'text-stone-500'}`}>
                <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                Previous Episodes ({previousEpisodes.length})
              </h3>
            </summary>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 pb-8">
              {previousEpisodes.map((ep) => (
                <div 
                  key={ep.id}
                  className={`rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow ${isEvening ? 'bg-slate-800 border-slate-700' : 'bg-white border-stone-200'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm line-clamp-1 mb-1 ${isEvening ? 'text-slate-100' : 'text-stone-900'}`}>
                        {ep.title}
                      </h4>
                      <p className={`text-xs mb-2 ${isEvening ? 'text-slate-500' : 'text-stone-400'}`}>
                        {new Date(ep.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {ep.duration_seconds && (
                          <span className="ml-2">
                            • {Math.floor(ep.duration_seconds / 60)}:{(ep.duration_seconds % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </p>
                      {ep.summary && (
                        <p className={`text-xs line-clamp-2 ${isEvening ? 'text-slate-400' : 'text-stone-600'}`}>{ep.summary}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Compact Audio Player */}
                  <audio 
                    controls 
                    className="w-full h-8 mt-3"
                    style={{ accentColor: '#ea580c' }}
                    preload="none"
                  >
                    <source src={ep.audio_url} type="audio/webm" />
                    <source src={ep.audio_url} type="audio/mpeg" />
                  </audio>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      {/* ===== ASK THE STOOP - LISTENER MAILBAG ===== */}
      <AskTheStoop />

      {/* ===== NOTIFICATION OPT-IN BANNER ===== */}
      <section className={`max-w-5xl mx-auto px-6 py-6`}>
        <div className={`rounded-xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-4 ${isEvening ? 'bg-slate-800 border-slate-700' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEvening ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
              <Bell className="text-orange-500" size={20} />
            </div>
            <div>
              <p className={`font-medium ${isEvening ? 'text-slate-100' : 'text-stone-900'}`}>
                Get the weekly drop right to your email
              </p>
              <p className={`text-sm ${isEvening ? 'text-slate-400' : 'text-stone-500'}`}>
                Never miss a new episode from the stoop
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNotificationModal(true)}
            className="flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <Bell size={16} />
            Subscribe to Notifications
          </button>
        </div>
      </section>

      {/* ===== NOTIFICATION OPT-IN MODAL ===== */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNotificationModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            {notificationSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">You&apos;re all set!</h3>
                <p className="text-stone-600">You&apos;ll get an email when new episodes drop.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-stone-900">Get Notified</h3>
                  <button onClick={() => setShowNotificationModal(false)} className="text-stone-400 hover:text-stone-600">
                    <BellOff size={20} />
                  </button>
                </div>
                <p className="text-stone-600 mb-4">Enter your email to receive notifications when new episodes drop.</p>
                <form onSubmit={handleNotificationOptIn} className="space-y-4">
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900"
                    required
                  />
                  <button
                    type="submit"
                    disabled={notificationLoading}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {notificationLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        <Bell size={18} />
                        Subscribe to Notifications
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className={`border-t ${theme.footer} transition-colors duration-500`}>
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className={`text-sm ${isEvening ? 'text-slate-500' : 'text-stone-500'}`}>
            &copy; {new Date().getFullYear()} Stoop Politics. All rights reserved.
          </p>
          {mounted && (
            <p className={`text-xs mt-2 ${isEvening ? 'text-slate-600' : 'text-stone-400'}`}>
              {timeOfDay === 'morning' && '🌅 Good morning from the stoop'}
              {timeOfDay === 'afternoon' && '☀️ Another sunny day in the city'}
              {timeOfDay === 'evening' && '🌙 Night vibes on the stoop'}
            </p>
          )}
        </div>
      </footer>
    </main>
  );
}

export default function HomePageClient(props: HomePageClientProps) {
  return (
    <StoopModeProvider>
      <HomePageContent {...props} />
    </StoopModeProvider>
  );
}
