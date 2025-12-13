'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Users, Mail, Bell, BellOff, Trash2, Ban, 
  Loader2, Search, CheckCircle, XCircle, MoreVertical 
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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
