"use client";

import React from 'react';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';

export default function NotificationPreferencesPage() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <NotificationPreferences />
    </div>
  );
}

