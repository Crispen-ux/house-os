'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeletons';
import { toast } from 'sonner';
import { ShoppingCart, Plus, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

export default function ShoppingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const [showAdd, setShowAdd] = useState(false);
  const [listTitle, setListTitle] = useState('');

  const { data: lists, isLoading } = useQuery({
    queryKey: ['shopping', householdId],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(`/shopping/lists/${householdId}`),
    enabled: !!householdId,
  });

  const createListMutation = useMutation({
    mutationFn: () => api.post('/shopping/lists', { householdId, title: listTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
      setListTitle(''); setShowAdd(false);
      toast.success('Shopping list created!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ listId, name }: { listId: string; name: string }) =>
      api.post(`/shopping/lists/${listId}/items`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
      toast.success('Item added!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (itemId: string) => api.patch(`/shopping/items/${itemId}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping'] }),
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Shopping Lists"
          description="Shared household shopping"
          icon={<ShoppingCart className="h-5 w-5" />}
        />

        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New List
          </Button>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
              <CardContent className="p-4">
                <form onSubmit={(e) => { e.preventDefault(); if (listTitle.trim()) createListMutation.mutate(); }} className="flex gap-2">
                  <Input placeholder="List name" value={listTitle} onChange={(e) => setListTitle(e.target.value)} required className="flex-1" />
                  <Button type="submit" isLoading={createListMutation.isPending}>Create</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!householdId ? (
          <EmptyState
            icon={<ShoppingCart className="h-7 w-7" />}
            title="No household"
            description="Create or join a household first"
          />
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <SkeletonCard key={i} lines={4} />)}
          </div>
        ) : (
          <div className="space-y-4">
            {lists?.data?.map((list: any) => (
              <motion.div key={list.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle>{list.title}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {list.items?.filter((i: any) => i.isPurchased).length}/{list.items?.length || 0} purchased
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0.5">
                      {list.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-hover transition-colors">
                          <button onClick={() => toggleMutation.mutate(item.id)} className="shrink-0 cursor-pointer">
                            {item.isPurchased
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              : <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                            }
                          </button>
                          <span className={`text-sm flex-1 ${item.isPurchased ? 'line-through text-muted-foreground' : ''}`}>
                            {item.name}
                          </span>
                          {item.quantity > 1 && <span className="text-xs text-muted-foreground">x{item.quantity}</span>}
                          {item.price && <span className="text-xs text-muted-foreground">${Number(item.price).toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as HTMLFormElement).querySelector('input');
                        if (input?.value) {
                          addItemMutation.mutate({ listId: list.id, name: input.value });
                          input.value = '';
                        }
                      }}
                      className="flex gap-2 mt-3 pt-3 border-t"
                    >
                      <Input placeholder="Add item..." className="flex-1" />
                      <Button type="submit" size="sm" variant="secondary">Add</Button>
                    </form>
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
