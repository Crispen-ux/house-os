'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Home } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function HouseholdsPage() {
  const queryClient = useQueryClient();
  const { refetchUser } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  const { data: households, isLoading } = useQuery({
    queryKey: ['households'],
    queryFn: () => api.get<{ success: boolean; data: any[] }>('/households'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/households', { name }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      await refetchUser();
      setShowCreate(false);
      setName('');
      toast.success('Household created!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Households"
          description="Manage your households"
          icon={<Home className="h-5 w-5" />}
          actions={
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Create
            </Button>
          }
        />

        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card>
              <CardContent className="p-4">
                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="flex gap-2">
                  <Input placeholder="Household name" value={name} onChange={(e) => setName(e.target.value)} required className="flex-1" />
                  <Button type="submit" isLoading={createMutation.isPending}>Create</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : !households?.data || households.data.length === 0 ? (
          <EmptyState
            icon={<Home className="h-7 w-7" />}
            title="No households yet"
            description="Create your first household to get started"
            action={
              <Button onClick={() => setShowCreate(true)} size="sm">
                <Plus className="mr-1 h-3.5 w-3.5" /> Create Household
              </Button>
            }
          />
        ) : (
          <motion.div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" variants={container} initial="hidden" animate="show">
            {households.data.map((h: any) => (
              <motion.div key={h.id} variants={item}>
                <Link href={`/households/${h.id}`}>
                  <Card hover>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover">
                          <Home className="h-5 w-5 text-foreground" />
                        </div>
                        <Badge>{h._count?.members || 0} members</Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{h.name}</h3>
                      {h.members?.[0]?.role && (
                        <p className="text-xs text-muted-foreground">Your role: {h.members[0].role}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
