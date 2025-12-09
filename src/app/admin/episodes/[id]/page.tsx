'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ExternalLink, Play, Trash2 } from 'lucide-react';

export default function TranscriptEditor({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [episode, setEpisode] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [playingNode, setPlayingNode] = useState<number | null>(null);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Episode Details
      const { data: ep } = await supabase.from('episodes').select('*').eq('id', resolvedParams.id).single();
      setEpisode(ep);

      // 2. Get Transcript Nodes
      const { data: transcript } = await supabase
        .from('transcript_nodes')
        .select('*')
        .eq('episode_id', resolvedParams.id)
        .order('display_order', { ascending: true });
      
      if (transcript) setNodes(transcript);
      setLoading(false);
    };
    fetchData();
  }, [resolvedParams.id]);

  // Save Changes (Updates specific node)
  const updateNode = async (nodeId: number, field: string, value: any) => {
    // Optimistic Update (Update UI immediately)
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, [field]: value } : n));

    // Send to DB
    await supabase.from('transcript_nodes').update({ [field]: value }).eq('id', nodeId);
  };

  // Publish Button
  const handlePublish = async () => {
    const { error } = await supabase
      .from('episodes')
      .update({ is_published: true, published_at: new Date() })
      .eq('id', resolvedParams.id);
    
    if (!error) router.push('/admin');
  };

  if (loading) return <div className="p-10">Loading Studio...</div>;

  return (
    <div className="min-h-screen bg-stone-50 p-6 pb-32 font-sans">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-8 sticky top-0 bg-stone-50/95 backdrop-blur z-20 py-4 border-b border-stone-200">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="p-2 hover:bg-stone-200 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-stone-900 text-lg">{episode?.title}</h1>
            <p className="text-xs text-stone-500 uppercase tracking-widest">Transcript Editor</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={handlePublish}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2"
          >
            <ExternalLink size={18} /> Publish Live
          </button>
        </div>
      </div>

      {/* EDITOR GRID */}
      <div className="max-w-3xl mx-auto space-y-4">
        {nodes.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-stone-300 rounded-xl text-stone-400">
            No transcript found. Did you generate it in the recording step?
          </div>
        ) : (
          nodes.map((node) => (
            <div 
              key={node.id} 
              className={`group relative bg-white p-4 rounded-xl border transition-all duration-200 ${
                node.reference_link ? 'border-blue-500 shadow-md ring-1 ring-blue-100' : 'border-stone-200 hover:border-stone-400'
              }`}
            >
              <div className="flex gap-4 items-start">
                
                {/* Timecode & Play */}
                <div className="w-16 shrink-0 pt-1">
                  <span className="text-xs font-mono text-stone-400 block mb-1">
                    {Math.floor(node.start_time || 0)}s
                  </span>
                  <button className="text-stone-300 hover:text-stone-900">
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>

                {/* Content Editor */}
                <div className="grow space-y-3">
                  {/* The Text Itself */}
                  <textarea
                    value={node.content}
                    onChange={(e) => updateNode(node.id, 'content', e.target.value)}
                    className="w-full text-lg text-stone-800 font-serif bg-transparent border-none focus:ring-0 p-0 resize-none"
                    rows={Math.ceil(node.content.length / 60)}
                  />

                  {/* The Link Adder */}
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-50">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Reference Link:</span>
                    <input 
                      type="text" 
                      placeholder="Paste URL here (e.g. https://nytimes.com/...)"
                      value={node.reference_link || ''}
                      onChange={(e) => updateNode(node.id, 'reference_link', e.target.value)}
                      className="grow text-sm bg-stone-50 border border-stone-200 rounded px-2 py-1 text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
