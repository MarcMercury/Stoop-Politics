'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mic, List, Edit, ExternalLink, Clock, Trash2, Wand2, Loader2, CheckCircle, MessageSquare, Mail, MailOpen, X, ChevronDown, ChevronUp, Users, Bell, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InboxMessage {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  admin_notes?: string;
}

export default function AdminDashboard() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Inbox state
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<number | null>(null);
  
  // Subscribers state
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [notifyingSubscribers, setNotifyingSubscribers] = useState<string | null>(null);

  const fetchEpisodes = async () => {
    const { data } = await supabase
      .from('episodes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setEpisodes(data);
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('inbox')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setMessages(data);
    setMessagesLoading(false);
  };

  const fetchSubscriberCount = async () => {
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('notifications_enabled', true);
    
    if (count !== null) setSubscriberCount(count);
  };

  useEffect(() => {
    fetchEpisodes();
    fetchMessages();
    fetchSubscriberCount();
  }, []);

  // Mark message as read
  const markAsRead = async (id: number) => {
    await supabase
      .from('inbox')
      .update({ is_read: true })
      .eq('id', id);
    
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  // Delete message
  const deleteMessage = async (id: number) => {
    setDeletingMessage(id);
    await supabase
      .from('inbox')
      .delete()
      .eq('id', id);
    
    setMessages(prev => prev.filter(m => m.id !== id));
    setDeletingMessage(null);
  };

  // Notify subscribers about a new episode
  const handleNotifySubscribers = async (episode: any) => {
    if (!episode.is_published) {
      alert('Please publish the episode first before notifying subscribers.');
      return;
    }
    
    if (!confirm(`Send notification to ${subscriberCount} subscribers about "${episode.title}"?`)) {
      return;
    }
    
    setNotifyingSubscribers(episode.id);
    
    try {
      const response = await fetch('/api/email/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeTitle: episode.title,
          episodeSummary: episode.summary,
          episodeId: episode.id,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Successfully notified ${result.sentCount} subscribers!`);
      } else {
        throw new Error(result.error || 'Failed to send notifications');
      }
    } catch (error: any) {
      alert('Error sending notifications: ' + error.message);
    } finally {
      setNotifyingSubscribers(null);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  // Generate Transcript for an episode
  const handleGenerateTranscript = async (episode: any) => {
    if (!episode.audio_url) {
      alert('No audio file found for this episode');
      return;
    }

    setTranscribing(episode.id);

    try {
      // First, delete any existing transcript nodes for this episode
      await supabase
        .from('transcript_nodes')
        .delete()
        .eq('episode_id', episode.id);

      // Fetch the audio file with CORS mode
      const response = await fetch(episode.audio_url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Failed to fetch audio file: ' + response.statusText);
      }
      const audioBlob = await response.blob();

      // Determine file extension from episode data or URL
      const extension = episode.audio_format || episode.audio_url.split('.').pop()?.split('?')[0] || 'webm';
      const filename = 'audio.' + extension;

      // Send to transcription API
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);
      formData.append('episodeId', episode.id);

      const transcriptRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await transcriptRes.json();

      if (!transcriptRes.ok) {
        throw new Error(result.error || 'Transcription failed');
      }

      alert('Transcript generated! ' + result.nodeCount + ' segments created.');
      
      // Refresh episodes to show updated status
      fetchEpisodes();
      
    } catch (error: any) {
      console.error('Transcription error:', error);
      alert('Error generating transcript: ' + error.message);
    } finally {
      setTranscribing(null);
    }
  };

  // Delete an episode
  const handleDelete = async (episode: any) => {
    if (!confirm('Are you sure you want to delete "' + episode.title + '"? This cannot be undone.')) {
      return;
    }

    setDeleting(episode.id);

    try {
      // Delete from database (cascade will delete transcript_nodes)
      const { error } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episode.id);

      if (error) throw error;

      // Remove from local state
      setEpisodes(prev => prev.filter(e => e.id !== episode.id));
      
    } catch (error: any) {
      alert('Error deleting episode: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Command Center</h1>
          <p className="text-stone-500 mt-1">Manage your episodes and broadcasts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/subscribers"
            className="bg-orange-100 text-orange-700 px-5 py-3 rounded-xl font-semibold hover:bg-orange-200 transition-colors flex items-center gap-2"
          >
            <Users size={20} />
            Subscribers
            {subscriberCount > 0 && (
              <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                {subscriberCount}
              </span>
            )}
          </Link>
          <Link 
            href="/admin/episodes/new"
            className="bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-lg"
          >
            <Mic size={20} />
            New Episode
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center">
              <List className="text-stone-600" size={18} />
            </div>
            <span className="text-sm font-medium text-stone-500">Episodes</span>
          </div>
          <p className="text-3xl font-bold text-stone-900">{episodes.length}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={18} />
            </div>
            <span className="text-sm font-medium text-stone-500">Published</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{episodes.filter(e => e.is_published).length}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Edit className="text-amber-600" size={18} />
            </div>
            <span className="text-sm font-medium text-stone-500">Drafts</span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{episodes.filter(e => !e.is_published).length}</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-orange-600" size={18} />
            </div>
            <span className="text-sm font-medium text-stone-500">Messages</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-orange-600">{messages.filter(m => !m.is_read).length}</p>
            <span className="text-xs text-stone-400">unread</span>
          </div>
        </div>

        <Link href="/admin/subscribers" className="bg-white rounded-xl border border-stone-200 p-5 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="text-purple-600" size={18} />
            </div>
            <span className="text-sm font-medium text-stone-500">Subscribers</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-purple-600">{subscriberCount}</p>
            <span className="text-xs text-stone-400">with notifications</span>
          </div>
        </Link>
      </div>

      {/* Messages Tile - Ask the Stoop Inbox */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm mb-10">
        <div className="px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MessageSquare className="text-orange-600" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-stone-900">Ask the Stoop</h2>
              <p className="text-xs text-stone-500">Listener messages &amp; questions</p>
            </div>
          </div>
          <span className="text-sm text-stone-400">{messages.length} total</span>
        </div>
        
        {messagesLoading ? (
          <div className="p-8 text-center text-stone-400">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="mx-auto mb-3 text-stone-300" size={40} />
            <p className="text-stone-500">No messages yet.</p>
            <p className="text-sm text-stone-400 mt-1">Listener questions will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`p-4 transition-colors ${!msg.is_read ? 'bg-orange-50/50' : 'hover:bg-stone-50'}`}
              >
                <div className="flex items-start gap-3">
                  {/* Read/Unread indicator */}
                  <div className="flex-shrink-0 mt-1">
                    {msg.is_read ? (
                      <MailOpen size={18} className="text-stone-400" />
                    ) : (
                      <Mail size={18} className="text-orange-500" />
                    )}
                  </div>
                  
                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="cursor-pointer"
                      onClick={() => {
                        setExpandedMessage(expandedMessage === msg.id ? null : msg.id);
                        if (!msg.is_read) markAsRead(msg.id);
                      }}
                    >
                      <p className={`text-sm ${expandedMessage === msg.id ? '' : 'line-clamp-2'} ${!msg.is_read ? 'font-medium text-stone-900' : 'text-stone-700'}`}>
                        {msg.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-stone-400">
                          {new Date(msg.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                        {expandedMessage !== msg.id && msg.message.length > 100 && (
                          <button className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5">
                            <ChevronDown size={12} />
                            more
                          </button>
                        )}
                        {expandedMessage === msg.id && (
                          <button className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-0.5">
                            <ChevronUp size={12} />
                            less
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {!msg.is_read && (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="p-1.5 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      disabled={deletingMessage === msg.id}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete message"
                    >
                      {deletingMessage === msg.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Episode Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h2 className="font-bold text-stone-900">All Episodes</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-stone-400">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            Loading episodes...
          </div>
        ) : episodes.length === 0 ? (
          <div className="p-12 text-center">
            <Mic className="mx-auto mb-4 text-stone-300" size={48} />
            <p className="text-stone-500 mb-4">No episodes yet. Time to hit record!</p>
            <Link 
              href="/admin/episodes/new"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors"
            >
              <Mic size={18} />
              Record First Episode
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Episode</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {episodes.map((episode) => (
                <tr key={episode.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-stone-900">{episode.title}</div>
                    {episode.summary && (
                      <div className="text-sm text-stone-400 truncate max-w-xs">{episode.summary}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {episode.is_published ? (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-sm text-stone-500">
                      <Clock size={14} />
                      {formatDuration(episode.duration_seconds)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {new Date(episode.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Generate Transcript Button */}
                      <button
                        onClick={() => handleGenerateTranscript(episode)}
                        disabled={transcribing === episode.id}
                        className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Generate Transcript"
                      >
                        {transcribing === episode.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Wand2 size={18} />
                        )}
                      </button>
                      
                      {/* Edit Transcript */}
                      <Link
                        href={'/admin/episodes/' + episode.id}
                        className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit Transcript"
                      >
                        <Edit size={18} />
                      </Link>
                      
                      {/* View Live */}
                      {episode.is_published && (
                        <Link
                          href="/"
                          target="_blank"
                          className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Live"
                        >
                          <ExternalLink size={18} />
                        </Link>
                      )}
                      
                      {/* Notify Subscribers */}
                      {episode.is_published && (
                        <button
                          onClick={() => handleNotifySubscribers(episode)}
                          disabled={notifyingSubscribers === episode.id}
                          className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                          title={`Notify ${subscriberCount} subscribers`}
                        >
                          {notifyingSubscribers === episode.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Send size={18} />
                          )}
                        </button>
                      )}
                      
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(episode)}
                        disabled={deleting === episode.id}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Episode"
                      >
                        {deleting === episode.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
