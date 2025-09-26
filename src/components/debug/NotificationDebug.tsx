"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { notificationsApi } from '@/lib/api';

// Simple debug component to test notifications API
export const NotificationDebug: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('No authentication token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await notificationsApi.list(1, 20);
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err: any) {
      console.error('NotificationDebug API error:', err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const token = localStorage.getItem('auth_token');

  if (!token) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
        <h3 className="font-bold">Authentication Debug</h3>
        <p>No authentication token found. Please log in.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-300 rounded max-w-2xl">
      <h3 className="font-bold text-lg mb-4">Notification System Debug</h3>
      
      <div className="space-y-3">
        <div>
          <strong>Auth Token:</strong> {token ? 'Present' : 'Missing'}
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Error:</strong> {error ? `${error}` : 'None'}
        </div>
        
        <div>
          <strong>Unread Count:</strong> {unreadCount}
        </div>
        
        <div>
          <strong>Total Notifications:</strong> {notifications.length}
        </div>
        
        <button 
          onClick={fetchNotifications}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Notifications'}
        </button>
        
        {notifications.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Notifications:</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((notif, index) => (
                <div key={notif.id || index} className="p-2 bg-white rounded border">
                  <div className="font-medium">{notif.title}</div>
                  <div className="text-sm text-gray-600">{notif.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Priority: {notif.priority} | Category: {notif.category} | 
                    Read: {notif.isRead ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

