"use client";

import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * Development-only WebSocket debug panel to help diagnose connection issues
 * Shows connection status, error details, and network information
 */
export const WebSocketDebugPanel: React.FC = () => {
  const { connectionStatus } = useNotifications();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '12px',
        fontSize: '11px',
        fontFamily: 'monospace',
        borderRadius: '6px',
        maxWidth: '300px',
        zIndex: 9999,
        border: '1px solid #333',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#00ff88' }}>
        🔧 WebSocket Debug
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        Status: <span style={{ 
          color: connectionStatus === 'connected' ? '#00ff88' : 
                connectionStatus === 'connecting' ? '#ffaa00' : '#ff4444',
          fontWeight: 'bold'
        }}>
          {connectionStatus}
        </span>
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        Network: <span style={{ color: navigator.onLine ? '#00ff88' : '#ff4444' }}>
          {navigator.onLine ? 'Online' : 'Offline'}
        </span>
      </div>
      
      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '6px' }}>
        Enhanced error logging enabled.
        <br />
        Check browser console for details.
      </div>
    </div>
  );
};
