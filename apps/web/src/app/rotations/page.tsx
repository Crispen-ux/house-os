'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Repeat, RotateCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

export default function RotationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['rotations', householdId],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(`/rotations/household/${householdId}`),
    enabled: !!householdId,
  });

  const rotateMutation = useMutation({
    mutationFn: (rotationId: string) => api.post(`/rotations/${rotationId}/rotate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotations'] });
      toast.success('Rotation executed!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rotations = data?.data || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Rotations"
          description="Automated chore rotations"
          icon={<Repeat className="h-5 w-5" />}
        />

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : !householdId ? (
          <EmptyState icon={<Repeat className="h-7 w-7" />} title="No household" description="Create or join a household first" />
        ) : rotations.length === 0 ? (
          <EmptyState icon={<Repeat className="h-7 w-7" />} title="No rotations" description="No rotations set up yet" />
        ) : (
          <div className="space-y-3">
            {rotations.map((r: any) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{r.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Every {r.cycleDays} days</span>
                        <Button size="sm" variant="outline" onClick={() => rotateMutation.mutate(r.id)} isLoading={rotateMutation.isPending}>
                          <RotateCw className="h-3 w-3 mr-1" /> Rotate
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {r.description && <p className="text-sm text-muted-foreground mb-3">{r.description}</p>}
                    <div className="space-y-1">
                      {r.rules?.map((rule: any) => (
                        <div key={rule.id} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-surface-hover">
                          <Badge variant="default">{rule.chore?.title}</Badge>
                          <span className="text-muted-foreground">&rarr;</span>
                          <span className="text-sm">{rule.member?.displayName || rule.member?.firstName}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
