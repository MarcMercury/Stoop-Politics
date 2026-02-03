'use client';

import { useEffect, useState, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Play, Pause, Link as LinkIcon, Check, Loader2, Wand2, ImagePlus, X } from 'lucide-react';

export default function TranscriptEditor({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [episode, setEpisode] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingNode, setPlayingNode] = useState<string | null>(null);
  
  // Cover image state
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      const { data: ep } = await supabase.from('episodes').select('*').eq('id', resolvedParams.id).single();
      setEpisode(ep);

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

  // Auto-save on blur
  const handleBlur = async (nodeId: string, field: string, value: any) => {
    setSaving(nodeId);
    
    const { error } = await supabase
      .from('transcript_nodes')
      .update({ [field]: value })
      .eq('id', nodeId);
    
    if (!error) {
      setSaved(nodeId);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  };

  // Update local state on change
  const updateNodeLocal = (nodeId: string, field: string, value: any) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, [field]: value } : n));
  };

  // Play audio at timestamp
  const playFromTime = (startTime: number, nodeId: string) => {
    if (audioRef.current && episode?.audio_url) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
      setPlayingNode(nodeId);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingNode(null);
    }
  };

  // Publish Episode
  const handlePublish = async () => {
    setPublishing(true);
    const { error } = await supabase
      .from('episodes')
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq('id', resolvedParams.id);
    
    if (!error) {
      // Send notifications to subscribers (non-blocking)
      try {
        const notifyResponse = await fetch('/api/email/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeTitle: episode.title,
            episodeSummary: episode.summary,
            episodeId: resolvedParams.id,
          }),
        });
        const notifyResult = await notifyResponse.json();
        if (notifyResponse.ok && notifyResult.sentCount > 0) {
          alert(`Episode published! Notified ${notifyResult.sentCount} subscribers.`);
        } else if (notifyResult.skipped) {
          // Email service not configured, just proceed
        }
      } catch (notifyError) {
        console.error('Failed to send notifications:', notifyError);
        // Don't block publishing if notifications fail
      }
      router.push('/admin');
    } else {
      alert('Error publishing: ' + error.message);
      setPublishing(false);
    }
  };

  // Handle cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Maximum size is 5MB.');
      return;
    }

    setCoverUploading(true);

    try {
      const coverFilename = `cover-${resolvedParams.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(`covers/${coverFilename}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(`covers/${coverFilename}`);

      // Update episode record
      const { error: dbError } = await supabase
        .from('episodes')
        .update({ cover_image_url: publicUrl })
        .eq('id', resolvedParams.id);

      if (dbError) throw dbError;

      // Update local state
      setEpisode((prev: any) => ({ ...prev, cover_image_url: publicUrl }));

    } catch (error: any) {
      alert('Error uploading cover: ' + error.message);
    } finally {
      setCoverUploading(false);
    }
  };

  // Remove cover image
  const handleRemoveCover = async () => {
    if (!confirm('Remove the cover image?')) return;

    setCoverUploading(true);

    try {
      const { error } = await supabase
        .from('episodes')
        .update({ cover_image_url: null })
        .eq('id', resolvedParams.id);

      if (error) throw error;

      setEpisode((prev: any) => ({ ...prev, cover_image_url: null }));
    } catch (error: any) {
      alert('Error removing cover: ' + error.message);
    } finally {
      setCoverUploading(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      
      {/* Hidden Audio Element */}
      {episode?.audio_url && (
        <audio ref={audioRef} src={episode.audio_url} onEnded={() => setPlayingNode(null)} />
      )}
      
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/admin')} 
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-stone-900">{episode?.title}</h1>
              <p className="text-xs text-stone-500 uppercase tracking-widest flex items-center gap-2">
                Transcript Editor
                {episode?.is_published && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">Live</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!episode?.is_published && (
              <button 
                onClick={handlePublish}
                disabled={publishing}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {publishing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ExternalLink size={18} />
                )}
                Publish Live
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MINI AUDIO PLAYER */}
      {episode?.audio_url && (
        <div className="sticky top-[73px] z-40 bg-stone-100 border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <audio controls className="w-full h-10" style={{ accentColor: '#ea580c' }}>
              <source src={episode.audio_url} type="audio/webm" />
            </audio>
          </div>
        </div>
      )}

      {/* EDITOR */}
      <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
        
        {/* Cover Image Section */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-stone-900 flex items-center gap-2">
              <ImagePlus size={18} className="text-orange-500" />
              Cover Image
            </h3>
            {episode?.cover_image_url && (
              <button
                onClick={handleRemoveCover}
                disabled={coverUploading}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X size={14} />
                Remove
              </button>
            )}
          </div>
          
          {episode?.cover_image_url ? (
            <div className="relative rounded-lg overflow-hidden aspect-[21/9] bg-stone-100">
              <img 
                src={episode.cover_image_url} 
                alt="Episode cover" 
                className="w-full h-full object-cover"
              />
              {coverUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              )}
            </div>
          ) : (
            <label className="cursor-pointer block">
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                coverUploading ? 'border-orange-300 bg-orange-50' : 'border-stone-300 hover:border-orange-400 hover:bg-orange-50'
              }`}>
                {coverUploading ? (
                  <Loader2 className="mx-auto mb-2 animate-spin text-orange-500" size={32} />
                ) : (
                  <ImagePlus className="mx-auto mb-2 text-stone-400" size={32} />
                )}
                <p className="text-sm text-stone-600 font-medium">
                  {coverUploading ? 'Uploading...' : 'Click to upload a cover image'}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Recommended: 21:9 aspect ratio, max 5MB
                </p>
              </div>
              <input 
                ref={coverInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleCoverUpload}
                className="hidden"
                disabled={coverUploading}
              />
            </label>
          )}
          
          {episode?.cover_image_url && (
            <div className="mt-3">
              <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium">
                <ImagePlus size={16} />
                Replace image
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={coverUploading}
                />
              </label>
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-orange-800">
            <strong>Tip:</strong> Edit the transcript text and add reference links. Changes auto-save when you click away. 
            Linked segments will appear highlighted on the public page.
          </p>
        </div>

        {nodes.length === 0 ? (
          <div className="text-center p-16 border-2 border-dashed border-stone-300 rounded-xl">
            <Wand2 className="mx-auto mb-4 text-stone-300" size={48} />
            <p className="text-stone-500 mb-2">No transcript found.</p>
            <p className="text-sm text-stone-400">Go back to the dashboard and click the wand icon to generate one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nodes.map((node) => (
              <div 
                key={node.id} 
                className={'group relative bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden ' + 
                  (node.reference_link 
                    ? 'border-orange-400 shadow-md ring-2 ring-orange-100' 
                    : 'border-stone-200 hover:border-stone-300')
                }
              >
                {/* Linked Indicator Bar */}
                {node.reference_link && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                )}
                
                <div className="p-4">
                  <div className="flex gap-4">
                    
                    {/* Timecode & Play Button */}
                    <div className="w-16 shrink-0 text-center">
                      <span className="text-xs font-mono text-stone-400 block mb-2">
                        {formatTime(node.start_time)}
                      </span>
                      <button 
                        onClick={() => playingNode === node.id ? pauseAudio() : playFromTime(node.start_time || 0, node.id)}
                        className={'w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors ' +
                          (playingNode === node.id 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200')
                        }
                      >
                        {playingNode === node.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="grow space-y-3">
                      {/* Editable Text */}
                      <textarea
                        value={node.content}
                        onChange={(e) => updateNodeLocal(node.id, 'content', e.target.value)}
                        onBlur={(e) => handleBlur(node.id, 'content', e.target.value)}
                        className="w-full text-lg text-stone-800 leading-relaxed bg-transparent border-none focus:ring-0 p-0 resize-none outline-none"
                        rows={Math.max(2, Math.ceil(node.content.length / 70))}
                      />

                      {/* Reference Link Input */}
                      <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
                        <LinkIcon size={14} className="text-stone-400 shrink-0" />
                        <input 
                          type="url" 
                          placeholder="Add reference URL (e.g. https://nytimes.com/article...)"
                          value={node.reference_link || ''}
                          onChange={(e) => updateNodeLocal(node.id, 'reference_link', e.target.value)}
                          onBlur={(e) => handleBlur(node.id, 'reference_link', e.target.value)}
                          className={'grow text-sm border rounded-lg px-3 py-2 outline-none transition-all ' +
                            (node.reference_link 
                              ? 'bg-orange-50 border-orange-200 text-orange-700' 
                              : 'bg-stone-50 border-stone-200 text-stone-600 focus:border-orange-400 focus:ring-2 focus:ring-orange-100')
                          }
                        />
                        {/* Save Indicator */}
                        {saving === node.id && (
                          <Loader2 size={16} className="animate-spin text-stone-400" />
                        )}
                        {saved === node.id && (
                          <Check size={16} className="text-green-500" />
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
