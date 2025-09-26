"use client";

import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

export const SimpleNotificationTest: React.FC = () => {
  const { notifications, unreadCount, loading, error, connectionStatus } = useNotifications();

  return (
    <div className="p-4 bg-green-50 border border-green-300 rounded">
      <h3 className="font-bold text-lg mb-2">🔔 Simple Notification Test</h3>
      <div className="space-y-1 text-sm">
        <div><strong>Unread Count:</strong> {unreadCount}</div>
        <div><strong>Total Notifications:</strong> {notifications.length}</div>
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Error:</strong> {error || 'None'}</div>
        <div><strong>Connection Status:</strong> {connectionStatus}</div>
        <div><strong>Hook Working:</strong> {notifications ? '✅ Yes' : '❌ No'}</div>
      </div>
    </div>
  );
};