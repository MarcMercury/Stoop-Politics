'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Users, Mail, Bell, BellOff, Trash2, Ban, 
  Loader2, Search, CheckCircle, XCircle, Send, X, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  notifications_enabled: boolean;
  status: 'active' | 'unsubscribed' | 'banned';
  updated_at: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'notifications'>('all');
  
  // Compose Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSubscribers = async () => {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (data) setSubscribers(data);
    if (error) console.error('Error fetching subscribers:', error);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Toggle notification status
  const toggleNotifications = async (subscriber: Subscriber) => {
    setActionLoading(subscriber.id);
    
    const { error } = await supabase
      .from('subscribers')
      .update({ notifications_enabled: !subscriber.notifications_enabled })
      .eq('id', subscriber.id);

    if (!error) {
      setSubscribers(prev => prev.map(s => 
        s.id === subscriber.id 
          ? { ...s, notifications_enabled: !s.notifications_enabled }
          : s
      ));
    }
    
    setActionLoading(null);
  };

  // Ban/Unban subscriber
  const toggleBan = async (subscriber: Subscriber) => {
    const newStatus = subscriber.status === 'banned' ? 'active' : 'banned';
    setActionLoading(subscriber.id);
    
    const { error } = await supabase
      .from('subscribers')
      .update({ status: newStatus })
      .eq('id', subscriber.id);

    if (!error) {
      setSubscribers(prev => prev.map(s => 
        s.id === subscriber.id 
          ? { ...s, status: newStatus }
          : s
      ));
    }
    
    setActionLoading(null);
  };

  // Delete subscriber
  const deleteSubscriber = async (subscriber: Subscriber) => {
    if (!confirm(`Are you sure you want to permanently delete ${subscriber.email}?`)) {
      return;
    }
    
    setActionLoading(subscriber.id);
    
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', subscriber.id);

    if (!error) {
      setSubscribers(prev => prev.filter(s => s.id !== subscriber.id));
    }
    
    setActionLoading(null);
  };

  // Filter and search
  const filteredSubscribers = subscribers.filter(s => {
    const matchesSearch = s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'active' ? s.status === 'active' :
      filter === 'notifications' ? s.notifications_enabled && s.status === 'active' :
      true;
    return matchesSearch && matchesFilter;
  });

  // Stats
  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    withNotifications: subscribers.filter(s => s.notifications_enabled && s.status === 'active').length,
    banned: subscribers.filter(s => s.status === 'banned').length,
  };

  // Reset compose modal
  const resetComposeModal = () => {
    setComposeSubject('');
    setComposeMessage('');
    setShowPreview(false);
    setSendResult(null);
  };

  const openComposeModal = () => {
    resetComposeModal();
    setShowComposeModal(true);
  };

  const closeComposeModal = () => {
    if (sending) return;
    if ((composeSubject || composeMessage) && !sendResult) {
      if (!confirm('Discard this message?')) return;
    }
    setShowComposeModal(false);
    resetComposeModal();
  };

  // Send custom notification
  const handleSendNotification = async () => {
    if (!composeSubject.trim()) {
      alert('Please enter a subject line');
      return;
    }
    if (!composeMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    if (stats.withNotifications === 0) {
      alert('No subscribers have notifications enabled');
      return;
    }

    if (!confirm(`Send this notification to ${stats.withNotifications} subscriber${stats.withNotifications !== 1 ? 's' : ''}?`)) {
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/email/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: composeSubject.trim(),
          message: composeMessage.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSendResult({
          success: true,
          message: `Successfully sent to ${result.sentCount} subscriber${result.sentCount !== 1 ? 's' : ''}!`
        });
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error: any) {
      setSendResult({
        success: false,
        message: error.message || 'Failed to send notification'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Send Notification</h2>
                <p className="text-sm text-stone-500 mt-0.5">
                  Send to {stats.withNotifications} subscriber{stats.withNotifications !== 1 ? 's' : ''} with notifications enabled
                </p>
              </div>
              <button
                onClick={closeComposeModal}
                disabled={sending}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {sendResult ? (
                /* Result Screen */
                <div className="py-8 text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    sendResult.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {sendResult.success ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${
                    sendResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {sendResult.success ? 'Sent!' : 'Failed'}
                  </h3>
                  <p className="text-stone-600">{sendResult.message}</p>
                  <button
                    onClick={closeComposeModal}
                    className="mt-6 px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : showPreview ? (
                /* Preview Screen */
                <div className="space-y-4">
                  <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
                    <div className="text-sm text-stone-500 mb-1">Subject:</div>
                    <div className="text-lg font-semibold text-stone-900 mb-4">
                      {composeSubject || '(No subject)'}
                    </div>
                    <div className="text-sm text-stone-500 mb-1">Message:</div>
                    <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                      {composeMessage || '(No message)'}
                    </div>
                  </div>
                  <p className="text-sm text-stone-500 text-center">
                    This is how your message will appear to subscribers.
                  </p>
                </div>
              ) : (
                /* Compose Form */
                <>
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                      Subject Line <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="e.g., Big News from the Stoop! 🎙️"
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900 placeholder:text-stone-400"
                      maxLength={100}
                      disabled={sending}
                    />
                    <div className="flex justify-between mt-1.5 text-xs text-stone-400">
                      <span>Keep it short and engaging</span>
                      <span>{composeSubject.length}/100</span>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={composeMessage}
                      onChange={(e) => setComposeMessage(e.target.value)}
                      placeholder="Write your message to subscribers..."
                      rows={8}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-stone-900 placeholder:text-stone-400 resize-none"
                      maxLength={2000}
                      disabled={sending}
                    />
                    <div className="flex justify-between mt-1.5 text-xs text-stone-400">
                      <span>Plain text only. Line breaks will be preserved.</span>
                      <span className={composeMessage.length > 1800 ? 'text-orange-500 font-medium' : ''}>
                        {composeMessage.length}/2000
                      </span>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-orange-800 mb-2">💡 Writing Tips</h4>
                    <ul className="text-xs text-orange-700 space-y-1">
                      <li>• Keep it conversational and authentic to the stoop vibe</li>
                      <li>• Use emojis sparingly for personality 🎙️</li>
                      <li>• Include a clear call to action if needed</li>
                      <li>• Subscribers can unsubscribe from the email footer</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!sendResult && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeComposeModal}
                    disabled={sending}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendNotification}
                    disabled={sending || !composeSubject.trim() || !composeMessage.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send to {stats.withNotifications}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Subscribers</h1>
            <p className="text-stone-500 mt-1">Manage your stoop community</p>
          </div>
        </div>
        
        {/* Send Notification Button */}
        <button
          onClick={openComposeModal}
          disabled={stats.withNotifications === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          title={stats.withNotifications === 0 ? 'No subscribers with notifications enabled' : `Send to ${stats.withNotifications} subscribers`}
        >
          <Send size={18} />
          <span className="hidden sm:inline">Send Notification</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-stone-500" size={18} />
            <span className="text-sm text-stone-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-500" size={18} />
            <span className="text-sm text-stone-500">Active</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="text-orange-500" size={18} />
            <span className="text-sm text-stone-500">Notifications On</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.withNotifications}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ban className="text-red-500" size={18} />
            <span className="text-sm text-stone-500">Banned</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.banned}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'active', 'notifications'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === f 
                    ? 'bg-stone-900 text-white' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'With Notifications'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center text-stone-400">
            <Loader2 className="animate-spin mx-auto mb-2" size={24} />
            Loading subscribers...
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 text-stone-300" size={48} />
            <p className="text-stone-500">
              {searchQuery ? 'No subscribers match your search' : 'No subscribers yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Notifications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-stone-400" />
                        <span className="font-medium text-stone-900">{subscriber.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {new Date(subscriber.subscribed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {subscriber.notifications_enabled ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-semibold">
                          <Bell size={12} />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full font-medium">
                          <BellOff size={12} />
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {subscriber.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Active
                        </span>
                      ) : subscriber.status === 'banned' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">
                          <Ban size={12} />
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full font-medium">
                          Unsubscribed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle Notifications */}
                        <button
                          onClick={() => toggleNotifications(subscriber)}
                          disabled={actionLoading === subscriber.id}
                          className={`p-2 rounded-lg transition-colors ${
                            subscriber.notifications_enabled 
                              ? 'text-orange-500 hover:bg-orange-50' 
                              : 'text-stone-400 hover:bg-stone-100'
                          } disabled:opacity-50`}
                          title={subscriber.notifications_enabled ? 'Disable notifications' : 'Enable notifications'}
                        >
                          {actionLoading === subscriber.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : subscriber.notifications_enabled ? (
                            <BellOff size={18} />
                          ) : (
                            <Bell size={18} />
                          )}
                        </button>
                        
                        {/* Ban/Unban */}
                        <button
                          onClick={() => toggleBan(subscriber)}
                          disabled={actionLoading === subscriber.id}
                          className={`p-2 rounded-lg transition-colors ${
                            subscriber.status === 'banned'
                              ? 'text-green-500 hover:bg-green-50'
                              : 'text-stone-400 hover:bg-stone-100 hover:text-red-600'
                          } disabled:opacity-50`}
                          title={subscriber.status === 'banned' ? 'Unban' : 'Ban'}
                        >
                          {subscriber.status === 'banned' ? (
                            <CheckCircle size={18} />
                          ) : (
                            <Ban size={18} />
                          )}
                        </button>
                        
                        {/* Delete */}
                        <button
                          onClick={() => deleteSubscriber(subscriber)}
                          disabled={actionLoading === subscriber.id}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
