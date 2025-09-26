"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { X, Settings, CheckCheck, Bell, Filter, RefreshCw, ChevronDown, ChevronRight, Users, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';
import { useResponsive } from '../../hooks/useResponsive';
import { cn } from '../../lib/utils';
import { useRouter } from 'next/navigation';
import { useUser } from '../../hooks/useUser';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'unread' | 'critical' | 'high' | 'medium' | 'low';
type CategoryFilter = 'all' | 'shipment' | 'distribution' | 'inventory' | 'system' | 'alert' | 'quality' | 'receipt' | 'user';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const router = useRouter();
  const { user } = useUser();
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showAggregated, setShowAggregated] = useState(true); // Toggle for aggregation
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();

  // Check if user is DEO for district-specific UI elements
  const isDEO = user?.roleName === "District Education Officer";
  const userDistrict = user?.district;
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAllAsRead,
    dismissAll,
    refreshNotifications,
    connectionStatus
  } = useNotifications();

  // Do not close on outside click per requirement

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status or priority
    if (filter === 'unread' && notification.isRead) return false;
    if (filter !== 'all' && filter !== 'unread' && notification.priority !== filter) return false;

    // Filter by category
    if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false;

    return true;
  });

  // Helper function to generate group titles - defined before useMemo
  const getGroupTitle = useCallback((type: string, category: string, count: number): string => {
    const categoryTitles: { [key: string]: string } = {
      shipment: 'Shipment Updates',
      distribution: 'Distribution Updates', 
      inventory: 'Inventory Alerts',
      system: 'System Notifications',
      alert: 'Critical Alerts',
      quality: 'Quality Issues',
      receipt: 'Receipt Confirmations',
      user: 'User Updates'
    };
    
    return categoryTitles[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} Notifications`;
  }, []);

  // Aggregation logic - group notifications by type and category
  const aggregatedNotifications = useMemo(() => {
    if (!showAggregated) return filteredNotifications.map(n => ({ type: 'single', notification: n }));

    const groups: { [key: string]: typeof filteredNotifications } = {};
    
    filteredNotifications.forEach(notification => {
      // Group by type + category for better aggregation
      const groupKey = `${notification.type}_${notification.category}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    const result: Array<{ type: 'single' | 'group', notification?: any, group?: { key: string, notifications: any[], title: string, count: number, unreadCount: number, priority: string } }> = [];

    Object.entries(groups).forEach(([groupKey, groupNotifications]) => {
      if (groupNotifications.length === 1) {
        // Single notification - show as is
        result.push({ type: 'single', notification: groupNotifications[0] });
      } else {
        // Multiple notifications - create aggregated group
        const unreadCount = groupNotifications.filter(n => !n.isRead).length;
        const highestPriority = groupNotifications.reduce((highest, current) => {
          const priorities: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorities[current.priority] || 1) > (priorities[highest] || 1) ? current.priority : highest;
        }, 'low');
        
        // Create a meaningful title based on the notification type
        const sampleNotification = groupNotifications[0];
        const title = getGroupTitle(sampleNotification.type, sampleNotification.category, groupNotifications.length);
        
        result.push({
          type: 'group',
          group: {
            key: groupKey,
            notifications: groupNotifications,
            title,
            count: groupNotifications.length,
            unreadCount,
            priority: highestPriority
          }
        });
      }
    });

    // Sort: unread groups first, then by priority, then by latest notification
    return result.sort((a, b) => {
      const aHasUnread = a.type === 'group' ? a.group!.unreadCount > 0 : !a.notification!.isRead;
      const bHasUnread = b.type === 'group' ? b.group!.unreadCount > 0 : !b.notification!.isRead;
      
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      
      // Then by priority
      const priorities: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = a.type === 'group' ? (priorities[a.group!.priority] || 1) : (priorities[a.notification!.priority] || 1);
      const bPriority = b.type === 'group' ? (priorities[b.group!.priority] || 1) : (priorities[b.notification!.priority] || 1);
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Then by latest notification date
      const aDate = a.type === 'group' ? Math.max(...a.group!.notifications.map(n => new Date(n.createdAt).getTime())) : new Date(a.notification!.createdAt).getTime();
      const bDate = b.type === 'group' ? Math.max(...b.group!.notifications.map(n => new Date(n.createdAt).getTime())) : new Date(b.notification!.createdAt).getTime();
      
      return bDate - aDate;
    });
  }, [filteredNotifications, showAggregated, getGroupTitle]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Handle scroll events to show/hide scroll-to-top button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const shouldShowScrollTop = target.scrollTop > 200; // Show after scrolling 200px
    setShowScrollTop(shouldShowScrollTop);
    
    // Debounced scroll event to improve performance
    // This is already optimized by React's event handling
  }, []);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Universal Overlay - prevents click-through on all devices */}
      <div 
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />

      {/* Mobile Dark Overlay */}
      {isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-41" />
      )}

      {/* Notification Center Panel */}
      <div 
        className={cn(
          "bg-white border rounded-lg shadow-lg z-50 flex flex-col",
          isMobile 
            ? "fixed top-16 left-4 right-4 bottom-4 h-auto" 
            : "absolute top-full mt-2 right-0 w-[26rem] md:w-[32rem] lg:w-[40rem] xl:w-[48rem] max-h-[80vh] min-h-[300px]"
        )} 
        ref={centerRef}
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {isDEO && userDistrict && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>District: {userDistrict}</span>
                </div>
              )}
            </div>
            {connectionStatus === 'connected' && (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Aggregation Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAggregated(!showAggregated)}
              className={cn(
                "text-xs transition-all duration-200",
                showAggregated 
                  ? "text-blue-600 hover:text-blue-700 hover:bg-white hover:border-blue-200 border border-transparent"
                  : "text-gray-600 hover:text-gray-700 hover:bg-white hover:border-gray-300 border border-transparent",
                "focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none"
              )}
              title={showAggregated ? "Show individual notifications" : "Group similar notifications"}
            >
              <Users className="h-4 w-4" />
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className={cn(
                  "text-xs transition-all duration-200",
                  "text-green-600 hover:text-green-700 hover:bg-white hover:border-green-200 border border-transparent",
                  "focus:ring-2 focus:ring-green-500 focus:ring-opacity-30 focus:outline-none",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                disabled={loading}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await dismissAll();
                  } catch {}
                }}
                className={cn(
                  "text-xs transition-all duration-200",
                  "text-red-600 hover:text-red-700 hover:bg-white hover:border-red-200 border border-transparent",
                  "focus:ring-2 focus:ring-red-500 focus:ring-opacity-30 focus:outline-none",
                  loading && "opacity-70 cursor-not-allowed"
                )}
                disabled={loading}
                title="Dismiss all notifications"
              >
                Dismiss all
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className={cn(
                "transition-all duration-200",
                "text-gray-600 hover:text-gray-700 hover:bg-white hover:border-gray-300 border border-transparent",
                "focus:ring-2 focus:ring-gray-500 focus:ring-opacity-30 focus:outline-none",
                loading && "opacity-70 cursor-not-allowed"
              )}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className={cn(
                "transition-all duration-200",
                "text-gray-500 hover:text-red-600 hover:bg-white hover:border-red-200 border border-transparent",
                "focus:ring-2 focus:ring-red-500 focus:ring-opacity-30 focus:outline-none"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* DEO District Info */}
        {isDEO && userDistrict && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span>Showing notifications relevant to {userDistrict} District</span>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="p-4 border-b bg-white">
          <div className="flex flex-col gap-3">
            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({notifications.length})</SelectItem>
                  <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(value: CategoryFilter) => setCategoryFilter(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="shipment">Shipments</SelectItem>
                <SelectItem value="distribution">Distributions</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="alert">Critical Alerts</SelectItem>
                <SelectItem value="quality">Quality Assurance</SelectItem>
                <SelectItem value="receipt">Receipt Confirmations</SelectItem>
                <SelectItem value="user">User Management</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications List - Mobile-First Scrolling */}
        <div className="flex-1 flex flex-col min-h-0">
          {error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-red-500 mb-2">Failed to load notifications</div>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : loading && notifications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-gray-500">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p className="text-sm">Loading notifications...</p>
              </div>
            </div>
          ) : aggregatedNotifications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications to display'}
                </p>
                {filter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilter('all');
                      setCategoryFilter('all');
                    }}
                    className="text-xs"
                  >
                    Show all notifications
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable Content Area - Mobile-First Intuitive Scrolling */}
              <div 
                ref={scrollAreaRef}
                className={cn(
                  "flex-1 overflow-y-auto",
                  // Modern scrollbar styling
                  "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
                  "hover:scrollbar-thumb-gray-400 active:scrollbar-thumb-gray-500",
                  "transition-colors duration-200",
                  // Focus management for accessibility
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                )}
                onScroll={handleScroll}
                tabIndex={0}
                role="region"
                aria-label="Notifications list"
                style={{ 
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch', // iOS momentum scrolling
                  // Better scroll performance on mobile
                  willChange: 'scroll-position'
                }}
              >
                {/* Content wrapper with proper padding */}
                <div className="divide-y divide-gray-100">
                {aggregatedNotifications.map((item, index) => {
                  if (item.type === 'single') {
                    return (
                      <NotificationItem
                        key={item.notification.id}
                        notification={item.notification}
                      />
                    );
                  } else {
                    // Render aggregated group
                    const group = item.group!;
                    const isExpanded = expandedGroups.has(group.key);
                    
                    return (
                      <div key={group.key}>
                        {/* Group Header */}
                        <div 
                          className={cn(
                            "p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200",
                            "border-b border-gray-100",
                            group.unreadCount > 0 && "bg-blue-50 border-blue-100"
                          )}
                          onClick={() => toggleGroup(group.key)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Expand/Collapse Icon */}
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              
                              {/* Group Icon */}
                              <div className={cn(
                                "flex-shrink-0 p-2 rounded-full",
                                group.priority === 'critical' ? 'bg-red-100' :
                                group.priority === 'high' ? 'bg-orange-100' :
                                group.priority === 'medium' ? 'bg-blue-100' :
                                'bg-gray-100'
                              )}>
                                <Users className={cn(
                                  "h-4 w-4",
                                  group.priority === 'critical' ? 'text-red-600' :
                                  group.priority === 'high' ? 'text-orange-600' :
                                  group.priority === 'medium' ? 'text-blue-600' :
                                  'text-gray-600'
                                )} />
                              </div>
                              
                              {/* Group Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={cn(
                                    "text-sm font-medium",
                                    group.unreadCount > 0 ? "text-gray-900" : "text-gray-700"
                                  )}>
                                    {group.title}
                                  </h4>
                                  <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    group.unreadCount > 0 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-gray-100 text-gray-600"
                                  )}>
                                    {group.count}
                                  </span>
                                  {group.unreadCount > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                      {group.unreadCount} new
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Latest: {new Date(Math.max(...group.notifications.map((n: any) => new Date(n.createdAt).getTime()))).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Group Content */}
                        {isExpanded && (
                          <div className="bg-gray-25">
                            {group.notifications.map((notification: any) => (
                              <div key={notification.id} className="border-l-2 border-gray-200 ml-4">
                                <NotificationItem
                                  notification={notification}
                                  showDismissButton={true}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
                </div>
                
                {/* Bottom padding for better scrolling experience */}
                <div className="h-4" />
              </div>

              {/* Scroll to Top Button - Fade in animation */}
              {showScrollTop && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "absolute bottom-4 right-4 rounded-full w-10 h-10 p-0",
                    "bg-white/95 backdrop-blur-sm border-gray-300 shadow-lg",
                    "hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-200",
                    "focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none",
                    "animate-in fade-in slide-in-from-bottom-2 duration-300",
                    "z-10" // Ensure it stays above content
                  )}
                  onClick={scrollToTop}
                  title="Scroll to top"
                  aria-label="Scroll to top of notifications"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 rounded-b-lg flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "justify-start transition-all duration-200",
              "text-blue-600 hover:text-blue-700 hover:bg-white hover:border-blue-200 border border-transparent",
              "focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 focus:outline-none",
              "font-medium"
            )}
            onClick={() => {
              onClose();
              router.push('/notifications');
            }}
          >
            View All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "justify-start transition-all duration-200",
              "text-gray-600 hover:text-gray-700 hover:bg-white hover:border-gray-300 border border-transparent",
              "focus:ring-2 focus:ring-gray-500 focus:ring-opacity-30 focus:outline-none"
            )}
            onClick={() => {
              onClose();
              router.push('/notifications/preferences');
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className={cn(
              "transition-all duration-200",
              "text-gray-500 hover:text-gray-700 hover:bg-white hover:border-gray-300 border border-transparent",
              "focus:ring-2 focus:ring-gray-500 focus:ring-opacity-30 focus:outline-none"
            )}
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );
};
