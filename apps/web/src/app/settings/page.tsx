'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { Settings, Moon, Sun, Bell, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => api.get<{ success: boolean; data: any }>('/settings/user'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/user', data),
    onSuccess: () => toast.success('Settings updated'),
    onError: (err: any) => toast.error(err.message),
  });

  const settings = userSettings?.data;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your preferences"
          icon={<Settings className="h-5 w-5" />}
        />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-4 w-4" /> Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
                </div>
                <div className="flex gap-1 border rounded-xl p-1 bg-surface-hover">
                  <Button size="sm" variant={theme === 'light' ? 'primary' : 'ghost'} onClick={() => setTheme('light')}>
                    <Sun className="h-3.5 w-3.5 mr-1.5" /> Light
                  </Button>
                  <Button size="sm" variant={theme === 'dark' ? 'primary' : 'ghost'} onClick={() => setTheme('dark')}>
                    <Moon className="h-3.5 w-3.5 mr-1.5" /> Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Morning Reminder</p>
                  <p className="text-xs text-muted-foreground">Daily reminder of today's chores</p>
                </div>
                <Button
                  size="sm"
                  variant={settings?.morningReminder ? 'primary' : 'outline'}
                  onClick={() => updateMutation.mutate({ morningReminder: !settings?.morningReminder })}
                >
                  {settings?.morningReminder ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Evening Reminder</p>
                  <p className="text-xs text-muted-foreground">Evening recap of unfinished chores</p>
                </div>
                <Button
                  size="sm"
                  variant={settings?.eveningReminder ? 'primary' : 'outline'}
                  onClick={() => updateMutation.mutate({ eveningReminder: !settings?.eveningReminder })}
                >
                  {settings?.eveningReminder ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'pt', label: 'Portuguese' },
                ]}
                value={settings?.language || 'en'}
                onChange={(e) => updateMutation.mutate({ language: e.target.value })}
              />
              <Input
                label="Timezone"
                placeholder="UTC"
                value={settings?.timezone || 'UTC'}
                onChange={(e) => updateMutation.mutate({ timezone: e.target.value })}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  );
}
