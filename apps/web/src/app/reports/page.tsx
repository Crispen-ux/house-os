'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3, TrendingUp, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: report } = useQuery({
    queryKey: ['report', householdId, startDate, endDate],
    queryFn: () => api.get<{ success: boolean; data: any }>(
      `/reports/task-completion?householdId=${householdId}&startDate=${startDate}&endDate=${endDate}`
    ),
    enabled: !!householdId && !!startDate && !!endDate,
  });

  const r = report?.data;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Household performance analytics"
          icon={<BarChart3 className="h-5 w-5" />}
        />

        <div className="flex flex-wrap gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="max-w-[160px]" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="max-w-[160px]" />
        </div>

        {r ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
              <StatCard label="Total Tasks" value={r.summary.total} icon={<CheckCircle className="h-5 w-5" />} iconColor="text-foreground" />
              <StatCard label="Completed" value={r.summary.completed} icon={<CheckCircle className="h-5 w-5" />} iconColor="text-emerald-600" />
              <StatCard label="Skipped" value={r.summary.skipped} icon={<Clock className="h-5 w-5" />} iconColor="text-amber-600" />
              <StatCard label="Overdue" value={r.summary.overdue} icon={<XCircle className="h-5 w-5" />} iconColor="text-red-600" />
              <StatCard label="Completion Rate" value={`${r.completionRate}%`} icon={<TrendingUp className="h-5 w-5" />} iconColor="text-blue-600" />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> By Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(r.byCategory || {}).map(([cat, data]: [string, any]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{cat}</span>
                          <span className="text-xs text-muted-foreground">{data.completed}/{data.total}</span>
                        </div>
                        <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> By Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(r.byMember || []).map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface-hover">
                        <span className="text-sm font-medium">{m.name}</span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-emerald-600">{m.completed} done</span>
                          <span className="text-muted-foreground">{m.points} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : (
          <EmptyState
            icon={<BarChart3 className="h-7 w-7" />}
            title="No household"
            description="Create or join a household to view reports"
          />
        )}
      </div>
    </AppShell>
  );
}
