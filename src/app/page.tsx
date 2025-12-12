import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronDown, User } from "lucide-react";

// Force dynamic rendering - no caching, fetch fresh data every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server Component - runs on every request
export default async function Home() {

  // 1. Fetch ALL published episodes for the archive dropdown
  const { data: allEpisodes, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  // Debug: Log to server console
  console.log('Fetched episodes:', allEpisodes?.length || 0, 'Error:', error?.message || 'none');

  // 2. Get the latest episode (first in the sorted list)
  const latestEpisode = allEpisodes?.[0];
  
  // 3. Get previous episodes for archive (exclude latest)
  const previousEpisodes = allEpisodes?.slice(1) || [];

  // If no episode is found, show the full branded "Coming Soon" experience
  if (!latestEpisode) {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        
        {/* ===== STICKY NAVIGATION BAR ===== */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/50 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-serif font-bold text-stone-900 hover:opacity-80 transition-opacity">
              Stoop<span className="text-orange-600">Politics</span>
            </Link>
            <Link 
              href="/login" 
              className="text-stone-400 hover:text-stone-900 transition-colors"
              title="Admin Login"
            >
              <User size={20} />
            </Link>
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
                <h1 className="text-3xl md:text-4xl font-serif font-black text-white">
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

        {/* ===== HERO IMAGE - NYC BROWNSTONE STREET ===== */}
        <header className="relative max-w-5xl mx-auto px-6 pt-8 pb-8">
          
          {/* Main Hero Image - NYC Brownstone Street with Stoops */}
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl mb-10 bg-stone-800 group cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?q=80&w=2000&auto=format&fit=crop"
              alt="NYC Brownstone Street"
              className="object-cover w-full h-full grayscale group-hover:grayscale-[50%] transition-all duration-700 ease-out scale-100 group-hover:scale-105"
            />
            
            {/* Gradient overlays for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/30 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 to-transparent"></div>
            
            {/* Live from Manhattan badge */}
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              Live from Manhattan
            </div>
            
            {/* Coming Soon Overlay */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="inline-flex items-center gap-2 bg-stone-700 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-3 shadow-lg">
                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                Coming Soon
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white drop-shadow-lg mb-2">
                First Episode Dropping Soon
              </h2>
              <p className="text-stone-300 text-sm">
                Stay tuned for hot takes from the stoop
              </p>
            </div>
          </div>

          {/* Welcome Card with Jessie Illustration */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-stone-200 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-orange-600"></div>
            <div className="flex items-start gap-6">
              {/* Jessie on Stoop Illustration */}
              <div className="hidden md:block flex-shrink-0 w-32">
                <img 
                  src="/jessie-stoop.png" 
                  alt="Jessie on the stoop"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
              <div className="flex-1 pl-4 md:pl-0">
                <p className="text-lg text-stone-700 leading-relaxed italic">
                  "Welcome to Stoop Politics — where we break down the news that matters to New Yorkers, straight from the stoop. No studio, no script, just real talk."
                </p>
                <p className="text-sm text-stone-500 mt-3 font-medium">— Jessie Mercury</p>
              </div>
            </div>
          </div>
        </header>

        {/* ===== FOOTER ===== */}
        <footer className="border-t border-stone-200 bg-stone-100 mt-8">
          <div className="max-w-5xl mx-auto px-6 py-8 text-center">
            <p className="text-sm text-stone-500">
              &copy; {new Date().getFullYear()} Stoop Politics. All rights reserved.
            </p>
          </div>
        </footer>

      </main>
    );
  }

  // 4. Fetch the transcript for the latest episode
  const { data: transcript } = await supabase
    .from('transcript_nodes')
    .select('*')
    .eq('episode_id', latestEpisode.id)
    .order('display_order', { ascending: true });

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      
      {/* ===== STICKY NAVIGATION BAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="text-xl font-serif font-bold text-stone-900 hover:opacity-80 transition-opacity">
            Stoop<span className="text-orange-600">Politics</span>
          </Link>
          
          {/* Right Side: Archive + Login */}
          <div className="flex items-center gap-6">
            
            {/* Archive Dropdown */}
            {previousEpisodes.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                  Previous Episodes
                  <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <div className="py-2">
                    {previousEpisodes.map((ep) => (
                      <Link 
                        key={ep.id}
                        href={'/?episode=' + ep.id}
                        className="block px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 hover:text-orange-600 transition-colors border-b border-stone-100 last:border-0"
                      >
                        <span className="font-medium line-clamp-1">{ep.title}</span>
                        <span className="text-xs text-stone-400 block mt-0.5">
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
              className="text-stone-400 hover:text-stone-900 transition-colors"
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
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 py-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-1">🎙️ The Digital Stoop</p>
              <h1 className="text-3xl md:text-4xl font-serif font-black text-white">
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
          {/* Cover image - use episode cover or fallback to brownstone street */}
          <img 
            src={latestEpisode.cover_image_url || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?q=80&w=2000&auto=format&fit=crop"}
            alt="NYC Stoop Scene"
            className="object-cover w-full h-full grayscale group-hover:grayscale-[50%] transition-all duration-700 ease-out scale-100 group-hover:scale-105"
          />
          
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 to-transparent"></div>
          
          {/* Live from Manhattan badge */}
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            Live from Manhattan
          </div>
          
          {/* Episode Badge & Title Overlay */}
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
          <div className="bg-white rounded-xl p-6 shadow-lg border border-stone-200 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-orange-600"></div>
            <p className="text-lg text-stone-700 leading-relaxed pl-4 italic">
              "{latestEpisode.summary}"
            </p>
          </div>
        )}
      </header>

      {/* ===== STICKY AUDIO PLAYER ===== */}
      <div className="sticky top-16 z-40 bg-stone-50/95 backdrop-blur-md border-y border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <audio 
            controls 
            className="w-full h-12"
            style={{ accentColor: '#ea580c' }}
          >
            <source src={latestEpisode.audio_url} type="audio/webm" />
            <source src={latestEpisode.audio_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>

      {/* ===== INTERACTIVE TRANSCRIPT ===== */}
      <article className="max-w-3xl mx-auto px-6 py-12 pb-32">
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-8">Transcript</h3>
        
        <div className="prose prose-lg prose-stone max-w-none leading-relaxed text-stone-700">
          {transcript && transcript.length > 0 ? (
            transcript.map((node) => (
              <span key={node.id} className="mr-1">
                {node.reference_link ? (
                  <a 
                    href={node.reference_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-600 font-semibold underline decoration-2 decoration-orange-200 hover:decoration-orange-600 hover:bg-orange-50 transition-all cursor-pointer rounded px-0.5"
                    title={node.reference_title || 'View Source'}
                  >
                    {node.content}
                  </a>
                ) : (
                  <span>{node.content}</span>
                )}
              </span>
            ))
          ) : (
            <p className="text-stone-400 italic">Transcript will appear here once generated.</p>
          )}
        </div>
      </article>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-stone-200 bg-stone-100">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-stone-500">
            &copy; {new Date().getFullYear()} Stoop Politics. All rights reserved.
          </p>
        </div>
      </footer>

    </main>
  );
}
