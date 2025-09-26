"use client";

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  Package, 
  Truck, 
  Warehouse, 
  AlertTriangle, 
  ShieldCheck, 
  ClipboardCheck, 
  User,
  Circle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  isRead: boolean;
  dismissed?: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  showDismissButton?: boolean; // Allow controlling dismiss button visibility
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'shipment':
      return Truck;
    case 'distribution':
      return Package;
    case 'inventory':
      return Warehouse;
    case 'alert':
      return AlertTriangle;
    case 'quality':
      return ShieldCheck;
    case 'receipt':
      return ClipboardCheck;
    case 'user':
      return User;
    default:
      return Bell;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 border-red-200 text-red-800';
    case 'high':
      return 'bg-orange-100 border-orange-200 text-orange-800';
    case 'medium':
      return 'bg-blue-100 border-blue-200 text-blue-800';
    case 'low':
      return 'bg-gray-100 border-gray-200 text-gray-800';
    default:
      return 'bg-gray-100 border-gray-200 text-gray-800';
  }
};

const getPriorityDot = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-blue-500';
    case 'low':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  showDismissButton = true, // Default to true for backward compatibility
}) => {
  const { markAsRead, dismiss } = useNotifications();
  const [isMarking, setIsMarking] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  
  const IconComponent = getCategoryIcon(notification.category);
  
  const handleClick = async (e: React.MouseEvent) => {
    // Don't handle click if it's on a button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Mark as read if unread
    if (!notification.isRead && !isMarking) {
      try {
        setIsMarking(true);
        await markAsRead(notification.id);
        // The state is already updated by the markAsRead function in the hook
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      } finally {
        setIsMarking(false);
      }
    }
    
    onClick?.();
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead && !isMarking) {
      try {
        setIsMarking(true);
        await markAsRead(notification.id);
        // The state is already updated by the markAsRead function in the hook
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // On error, we could revert the optimistic update, but the hook handles this
      } finally {
        setIsMarking(false);
      }
    }
  };

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDismissing) {
      try {
        setIsDismissing(true);
        // Play a quick fade/scale transition before removal for better UX
        setTimeout(async () => {
          await dismiss(notification.id);
        }, 150);
        // The notification is already removed from state by the dismiss function in the hook
        // so this component will unmount immediately
      } catch (error) {
        console.error('Failed to dismiss notification:', error);
        // On error, reset the dismissing state so user can try again
        setIsDismissing(false);
      }
      // Note: We don't set setIsDismissing(false) in finally because 
      // the component should be unmounted if successful
    }
  }

  return (
    <div
      className={cn(
        "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200",
        !notification.isRead && "bg-blue-50 border-blue-100 shadow-sm",
        isMarking && "bg-blue-100 border-blue-200",
        isDismissing && "opacity-0 scale-95 bg-red-50 border-red-100",
        notification.dismissed && "opacity-60 bg-gray-25" // Visual indicator for dismissed notifications
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 p-2 rounded-full",
          notification.priority === 'critical' ? 'bg-red-100' :
          notification.priority === 'high' ? 'bg-orange-100' :
          notification.priority === 'medium' ? 'bg-blue-100' :
          'bg-gray-100'
        )}>
          <IconComponent className={cn(
            "h-4 w-4",
            notification.priority === 'critical' ? 'text-red-600' :
            notification.priority === 'high' ? 'text-orange-600' :
            notification.priority === 'medium' ? 'text-blue-600' :
            'text-gray-600'
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className={cn(
              "text-sm font-medium truncate",
              !notification.isRead ? "text-gray-900" : "text-gray-700"
            )}>
              {notification.title}
            </h4>
            
            <div className="flex items-center gap-2">
              {/* Dismissed Badge */}
              {notification.dismissed && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0 bg-gray-100 border-gray-300 text-gray-600"
                >
                  Dismissed
                </Badge>
              )}
              
              {/* Priority Badge */}
              <Badge 
                variant="outline" 
                className={cn("text-xs px-2 py-0", getPriorityColor(notification.priority))}
              >
                {notification.priority}
              </Badge>
            </div>
          </div>

          {/* Message */}
          <p className={cn(
            "text-sm leading-relaxed mb-2",
            !notification.isRead ? "text-gray-700" : "text-gray-500",
            isMarking && "opacity-70"
          )}>
            {notification.message}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {/* Priority Dot */}
              <div className={cn("w-2 h-2 rounded-full", getPriorityDot(notification.priority))} />
              
              {/* Time */}
              <span>
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              
              {/* Category */}
              <span>•</span>
              <span className="capitalize">{notification.category}</span>
            </div>

            {/* Read Status & Action */}
            <div className="flex items-center gap-2">
              {!notification.isRead ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs transition-all duration-200",
                    "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200",
                    "focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none",
                    isMarking && "opacity-70 cursor-not-allowed"
                  )}
                  onClick={handleMarkAsRead}
                  disabled={isMarking}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {isMarking ? 'Marking...' : 'Mark as read'}
                </Button>
              ) : (
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Read
                </div>
              )}

              {/* Only show dismiss button if not already dismissed and showDismissButton is true */}
              {!notification.dismissed && showDismissButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 text-xs transition-all duration-200",
                    "text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200",
                    "focus:ring-2 focus:ring-red-500 focus:ring-opacity-30 focus:outline-none",
                    "rounded-full",
                    isDismissing && "opacity-70 cursor-not-allowed"
                  )}
                  onClick={handleDismiss}
                  disabled={isDismissing}
                  title="Dismiss notification"
                >
                  {isDismissing ? (
                    <div className="animate-spin w-3 h-3 border border-gray-300 border-t-red-500 rounded-full" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Data (if available) */}
      {notification.data && (
        <div className="mt-3 pl-11">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600">
              {notification.data.referenceNumber && (
                <div>Reference: <span className="font-medium">{notification.data.referenceNumber}</span></div>
              )}
              {notification.data.destination && (
                <div>Destination: <span className="font-medium">{notification.data.destination}</span></div>
              )}
              {notification.data.itemCount && (
                <div>Items: <span className="font-medium">{notification.data.itemCount}</span></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
