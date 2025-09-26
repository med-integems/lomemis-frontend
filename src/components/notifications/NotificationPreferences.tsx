"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Loader2, Save } from 'lucide-react';
import { notificationsApi } from '@/lib/api';

type Preference = {
  id?: number;
  notificationType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  escalationEnabled: boolean;
};

export const NotificationPreferences: React.FC = () => {
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getPreferences();
      setPrefs(res.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (index: number, key: keyof Preference) => (value: boolean) => {
    setPrefs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value } as Preference;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setSavedMessage(null);
    setError(null);
    try {
      await notificationsApi.updatePreferences(
        prefs.map(({ notificationType, inAppEnabled, emailEnabled, smsEnabled, escalationEnabled }) => ({
          notificationType,
          inAppEnabled,
          emailEnabled,
          smsEnabled,
          escalationEnabled,
        }))
      );
      setSavedMessage('Preferences updated');
    } catch (e: any) {
      setError(e?.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMessage(null), 2500);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">Choose how you want to be notified by type.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground">
            <div className="col-span-4">Type</div>
            <div className="col-span-2 text-center">In-app</div>
            <div className="col-span-2 text-center">Email</div>
            <div className="col-span-2 text-center">SMS</div>
            <div className="col-span-2 text-center">Escalate</div>
          </div>
          <Separator />
          {prefs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No preference records found.</div>
          ) : (
            prefs.map((p, idx) => (
              <div key={`${p.notificationType}-${idx}`} className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-0">
                <div className="col-span-4">
                  <div className="font-medium text-sm">{p.notificationType.replaceAll('_',' ')}</div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <Switch checked={p.inAppEnabled} onCheckedChange={toggle(idx, 'inAppEnabled')} />
                </div>
                <div className="col-span-2 flex justify-center">
                  <Switch checked={p.emailEnabled} onCheckedChange={toggle(idx, 'emailEnabled')} />
                </div>
                <div className="col-span-2 flex justify-center">
                  <Switch checked={p.smsEnabled} onCheckedChange={toggle(idx, 'smsEnabled')} />
                </div>
                <div className="col-span-2 flex justify-center">
                  <Switch checked={p.escalationEnabled} onCheckedChange={toggle(idx, 'escalationEnabled')} />
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || loading}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Preferences
        </Button>
        {savedMessage && <span className="text-xs text-green-600">{savedMessage}</span>}
      </div>
    </div>
  );
};

