'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Bell, CheckCheck, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const channelIcons: Record<string, any> = {
  PUSH: Smartphone,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ success: boolean; data: any[] }>('/notifications'),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All marked as read');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const notifications = data?.data || [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Notifications"
          description={`${notifications.filter((n: any) => !n.isRead).length} unread`}
          icon={<Bell className="h-5 w-5" />}
          actions={
            <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} disabled={notifications.length === 0}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark All Read
            </Button>
          }
        />

        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-7 w-7" />}
            title="No notifications yet"
            description="You're all caught up"
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any, i: number) => {
              const Icon = channelIcons[n.type] || Bell;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <Card className={n.isRead ? '' : 'border-primary/20 bg-primary/5'}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <Avatar name={n.title} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.isRead ? 'text-muted-foreground' : 'font-medium'}`}>
                          {n.title}
                        </p>
                        {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatDate(n.createdAt)} at {formatTime(n.createdAt)}
                        </p>
                      </div>
                      <Badge variant={n.channel}>{n.channel}</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
