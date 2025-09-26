"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationsHistoryPage() {
  const { markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [dismissedFilter, setDismissedFilter] = useState<'all' | 'active' | 'dismissed'>('all');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<{ key: string; name: string }[]>([]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const loadCategories = async () => {
    try {
      const res = await notificationsApi.categories();
      setCategories(res.data || []);
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Apply dismissed filter based on user selection
      let dismissedValue: boolean | undefined;
      if (dismissedFilter === 'active') dismissedValue = false;
      else if (dismissedFilter === 'dismissed') dismissedValue = true;
      else dismissedValue = undefined; // 'all' - show everything
      
      const res = await notificationsApi.list(page, limit, unreadOnly, { 
        category, 
        priority: priority as any, 
        search,
        dismissed: dismissedValue
      });
      setItems(res.data?.notifications || []);
      setTotal(res.data?.total || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, unreadOnly, dismissedFilter, category, priority]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notification History</h2>
        {unreadOnly || unreadCount > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              const prev = items;
              // Optimistically mark current page as read in UI
              setItems((p) => p.map((n) => ({ ...n, isRead: true })));
              try {
                await markAllAsRead();
              } catch (e) {
                // Revert on error
                setItems(prev);
              }
            }}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            Mark all as read
          </Button>
        ) : null}
      </div>

      <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="text-sm text-muted-foreground">Search</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or message" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Category</label>
          <Select value={category || 'all'} onValueChange={(val) => setCategory(val === 'all' ? undefined : val)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.key} value={c.key}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Priority</label>
          <Select value={priority || 'all'} onValueChange={(val) => setPriority(val === 'all' ? undefined : val)}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit">Search</Button>
          <Button type="button" variant={unreadOnly ? 'default' : 'outline'} onClick={() => { setUnreadOnly(!unreadOnly); setPage(1); }}>Unread only</Button>
          <Select value={dismissedFilter} onValueChange={(val: 'all' | 'active' | 'dismissed') => { setDismissedFilter(val); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>

      <Separator />

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No notifications found.</div>
      ) : (
        <div className="space-y-0 border rounded-md divide-y">
          {items.map((n) => (
            <NotificationItem 
              key={n.id} 
              notification={n} 
              showDismissButton={false} // Disable dismiss button in history - notifications should stay for reference
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
          <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      </div>
    </div>
  );
}
