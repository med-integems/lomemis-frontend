"use client";

import React, { useState } from 'react';
import { Bell, BellRing, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, connectionStatus } = useNotifications();
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={handleToggle}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon */}
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-blue-600" />
        ) : (
          <Bell className="h-5 w-5 text-gray-600" />
        )}
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-5"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        {/* Connection Status Indicator */}
        <div className="absolute -bottom-1 -right-1">
          {connectionStatus === 'connected' ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : connectionStatus === 'connecting' ? (
            <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>
      </Button>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isOpen}
        onClose={handleClose}
      />
    </div>
  );
};