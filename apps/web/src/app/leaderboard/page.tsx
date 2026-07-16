'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

const rankIcons = [Trophy, Medal, Award];
const rankColors = [
  'bg-amber-500/20 text-amber-600 ring-2 ring-amber-500/30',
  'bg-gray-300/20 text-gray-500',
  'bg-orange-500/20 text-orange-600',
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const [type, setType] = useState('WEEKLY');

  const { data } = useQuery({
    queryKey: ['leaderboard', householdId, type],
    queryFn: () => api.get<{ success: boolean; data: any }>(`/leaderboard/${householdId}/${type}`),
    enabled: !!householdId,
  });

  const entries = data?.data?.entries || [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Leaderboard"
          description="See who's leading the household"
          icon={<Trophy className="h-5 w-5 text-amber-600" />}
        />

        <div className="flex gap-2">
          <Select
            options={[
              { value: 'WEEKLY', label: 'Weekly' },
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'ALL_TIME', label: 'All Time' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {!householdId ? (
            <EmptyState icon={<TrendingUp className="h-7 w-7" />} title="No household" description="Create or join a household first" />
          ) : entries.length === 0 ? (
            <EmptyState icon={<Trophy className="h-7 w-7" />} title="No entries yet" description="Complete chores to earn points!" />
          ) : (
            entries.map((entry: any, i: number) => {
              const RankIcon = rankIcons[i] || Award;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Card className={`transition-all ${i === 0 ? 'ring-1 ring-amber-500/20' : ''}`}>
                    <div className="p-4 flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${rankColors[i] || 'bg-surface-hover text-muted-foreground'}`}>
                        <RankIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {entry.user?.displayName || `${entry.user?.firstName} ${entry.user?.lastName}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.completedTasks} completed · {entry.skippedTasks} skipped
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{entry.totalPoints}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
