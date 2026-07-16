'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonStat, SkeletonList, SkeletonCard } from '@/components/ui/skeletons';
import { formatDate } from '@/lib/utils';
import {
  ListChecks, ShoppingCart, CalendarDays, Bell,
  Home, ArrowRight, Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const householdName = user?.primaryHousehold?.name;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  const { data: choresRes, isLoading: choresLoading } = useQuery({
    queryKey: ['chores', 'my-tasks', 'PENDING'],
    queryFn: () => api.get<{ success: boolean; data: any[] }>('/chores/my-tasks?status=PENDING'),
    enabled: !!householdId,
  });

  const { data: shoppingRes, isLoading: shoppingLoading } = useQuery({
    queryKey: ['shopping', 'lists', householdId],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(`/shopping/lists/${householdId}`),
    enabled: !!householdId,
  });

  const { data: calendarRes, isLoading: calendarLoading } = useQuery({
    queryKey: ['calendar', householdId, todayStart, todayEnd],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(
      `/calendar/${householdId}?startDate=${todayStart}&endDate=${todayEnd}`,
    ),
    enabled: !!householdId,
  });

  const { data: unreadRes, isLoading: unreadLoading } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get<{ success: boolean; data: any[] }>('/notifications/unread'),
    enabled: true,
  });

  const pendingChores = choresRes?.data ?? [];
  const shoppingLists = shoppingRes?.data ?? [];
  const calendarEvents = calendarRes?.data ?? [];
  const unreadNotifications = unreadRes?.data ?? [];

  const totalShoppingItems = shoppingLists.reduce((sum: number, list: any) => sum + (list.items?.length ?? 0), 0);
  const purchasedItems = shoppingLists.reduce(
    (sum: number, list: any) => sum + (list.items?.filter((i: any) => i.isPurchased).length ?? 0),
    0,
  );

  const statsLoading = choresLoading || shoppingLoading || calendarLoading || unreadLoading;

  return (
    <AppShell>
      <motion.div
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {householdName ?? 'Household OS'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {householdId && (
            <Link href="/households">
              <Button variant="outline" size="sm">
                <Home className="mr-1.5 h-3.5 w-3.5" />
                {householdName ?? 'Household'}
              </Button>
            </Link>
          )}
        </motion.div>

        <motion.div variants={item} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
          ) : (
            <>
              <StatCard
                label="Pending Chores"
                value={pendingChores.length}
                icon={<ListChecks className="h-5 w-5" />}
                iconColor="text-amber-600 dark:text-amber-400"
              />
              <StatCard
                label="Shopping Items"
                value={`${purchasedItems}/${totalShoppingItems}`}
                icon={<ShoppingCart className="h-5 w-5" />}
                iconColor="text-blue-600 dark:text-blue-400"
                description={totalShoppingItems > 0 ? `${Math.round((purchasedItems / totalShoppingItems) * 100)}% purchased` : undefined}
              />
              <StatCard
                label="Today's Events"
                value={calendarEvents.length}
                icon={<CalendarDays className="h-5 w-5" />}
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="Unread"
                value={unreadNotifications.length}
                icon={<Bell className="h-5 w-5" />}
                iconColor="text-violet-600 dark:text-violet-400"
              />
            </>
          )}
        </motion.div>

        <motion.div variants={item} className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Chores</CardTitle>
              <Link href="/chores">
                <Button variant="ghost" size="xs" className="text-muted-foreground">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {choresLoading ? (
                <SkeletonList count={3} />
              ) : pendingChores.length === 0 ? (
                <EmptyState
                  icon={<ListChecks className="h-6 w-6" />}
                  title="No pending chores"
                  description="All caught up!"
                />
              ) : (
                <div className="space-y-1">
                  {pendingChores.slice(0, 5).map((task: any, i: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.chore?.title ?? 'Chore'}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <Badge variant="info" dot>{task.status}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Today's Events</CardTitle>
              <Link href="/calendar">
                <Button variant="ghost" size="xs" className="text-muted-foreground">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {calendarLoading ? (
                <SkeletonList count={3} />
              ) : calendarEvents.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title="No events today"
                  description="Your schedule is clear"
                />
              ) : (
                <div className="space-y-1">
                  {calendarEvents.slice(0, 5).map((event: any, i: number) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.type === 'meal' ? 'Meal' : 'Chore'}
                        </p>
                      </div>
                      {event.status && (
                        <Badge variant={event.status === 'COMPLETED' ? 'success' : 'warning'} dot>{event.status}</Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Shopping Summary</CardTitle>
              <Link href="/shopping">
                <Button variant="ghost" size="xs" className="text-muted-foreground">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {shoppingLoading ? (
                <SkeletonList count={2} />
              ) : shoppingLists.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="h-6 w-6" />}
                  title="No shopping lists"
                  description="Create your first shopping list"
                />
              ) : (
                <div className="space-y-3">
                  {shoppingLists.map((list: any) => {
                    const total = list.items?.length ?? 0;
                    const bought = list.items?.filter((i: any) => i.isPurchased).length ?? 0;
                    const pct = total > 0 ? Math.round((bought / total) * 100) : 0;
                    return (
                      <div key={list.id} className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-surface-hover transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{list.title}</p>
                          <p className="text-xs text-muted-foreground">{bought}/{total} items purchased</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <Badge variant={pct === 100 ? 'success' : 'info'}>{pct}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Notifications</CardTitle>
              <Link href="/notifications">
                <Button variant="ghost" size="xs" className="text-muted-foreground">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {unreadLoading ? (
                <SkeletonList count={3} />
              ) : unreadNotifications.length === 0 ? (
                <EmptyState
                  icon={<Bell className="h-6 w-6" />}
                  title="No new notifications"
                  description="You're all caught up"
                />
              ) : (
                <div className="space-y-1">
                  {unreadNotifications.slice(0, 5).map((n: any, i: number) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Bell className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                        )}
                      </div>
                      <Badge variant="info" dot>New</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
