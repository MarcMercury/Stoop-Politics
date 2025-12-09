'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mic, List, Edit, ExternalLink, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEpisodes = async () => {
      const { data } = await supabase
        .from('episodes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setEpisodes(data);
      setLoading(false);
    };
    fetchEpisodes();
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Create New Episode Card */}
        <Link 
          href="/admin/episodes/new"
          className="bg-white rounded-xl border border-stone-200 p-8 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center group-hover:bg-stone-700 transition-colors">
              <Mic className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-stone-900">Record New Episode</h2>
          </div>
          <p className="text-stone-500">
            Start recording a new episode with cover art and automatic transcription.
          </p>
        </Link>

        {/* Stats Card */}
        <div className="bg-white rounded-xl border border-stone-200 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <List className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-stone-900">Episodes</h2>
          </div>
          <p className="text-4xl font-bold text-stone-900">{episodes.length}</p>
          <p className="text-stone-500 text-sm">
            {episodes.filter(e => e.is_published).length} published
          </p>
        </div>
      </div>

      {/* Episode List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-bold text-stone-900">All Episodes</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-stone-400">Loading...</div>
        ) : episodes.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            No episodes yet. Record your first one!
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {episodes.map((episode) => (
              <div key={episode.id} className="px-6 py-4 flex items-center justify-between hover:bg-stone-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-stone-900">{episode.title}</h3>
                    {episode.is_published ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-stone-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDuration(episode.duration_seconds)}
                    </span>
                    <span>
                      {new Date(episode.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/episodes/${episode.id}`}
                    className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Edit Transcript"
                  >
                    <Edit size={18} />
                  </Link>
                  {episode.is_published && (
                    <Link
                      href="/"
                      className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                      title="View Live"
                    >
                      <ExternalLink size={18} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
