'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowLeftRight, CheckCircle, XCircle, Send, MessageSquare,
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { motion } from 'framer-motion';

type SwapStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';

interface Swap {
  id: string;
  status: SwapStatus;
  reason?: string;
  createdAt: string;
  requester: { id: string; firstName: string; lastName: string; displayName: string | null; avatarUrl: string | null };
  requestedTo: { id: string; firstName: string; lastName: string; displayName: string | null; avatarUrl: string | null };
  originalChore: { id: string; title: string; category: string };
  alternateChore?: { id: string; title: string; category: string } | null;
  messages?: any[];
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600' },
  ACCEPTED: { label: 'Accepted', color: 'bg-emerald-500/10 text-emerald-600' },
  DECLINED: { label: 'Declined', color: 'bg-red-500/10 text-red-600' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-600' },
  EXPIRED: { label: 'Expired', color: 'bg-rose-500/10 text-rose-600' },
};

export default function SwapsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const [statusFilter, setStatusFilter] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [showMessage, setShowMessage] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const [reqChoreId, setReqChoreId] = useState('');
  const [reqTargetId, setReqTargetId] = useState('');
  const [reqReason, setReqReason] = useState('');

  const { data: swapsData } = useQuery({
    queryKey: ['swaps', householdId, statusFilter],
    queryFn: () => api.get<{ success: boolean; data: Swap[] }>(`/swaps/household/${householdId}${statusFilter ? `?status=${statusFilter}` : ''}`),
    enabled: !!householdId,
  });

  const { data: mySwaps } = useQuery({
    queryKey: ['my-swaps'],
    queryFn: () => api.get<{ success: boolean; data: Swap[] }>('/swaps/my'),
  });

  const { data: chores } = useQuery({
    queryKey: ['chores', householdId],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(`/chores/household/${householdId}`),
    enabled: !!householdId && showRequest,
  });

  const { data: household } = useQuery({
    queryKey: ['household', householdId],
    queryFn: () => api.get<{ success: boolean; data: any }>(`/households/${householdId}`),
    enabled: !!householdId && showRequest,
  });

  const requestMutation = useMutation({
    mutationFn: () => api.post('/swaps/request', {
      householdId, originalChoreId: reqChoreId, requestedToId: reqTargetId, reason: reqReason || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      queryClient.invalidateQueries({ queryKey: ['my-swaps'] });
      setShowRequest(false); setReqChoreId(''); setReqTargetId(''); setReqReason('');
      toast.success('Swap request sent!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const respondMutation = useMutation({
    mutationFn: ({ swapId, decision }: { swapId: string; decision: 'ACCEPTED' | 'DECLINED' }) =>
      api.post(`/swaps/${swapId}/respond`, { decision }),
    onSuccess: (_, { decision }) => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      queryClient.invalidateQueries({ queryKey: ['my-swaps'] });
      toast.success(decision === 'ACCEPTED' ? 'Swap accepted!' : 'Swap declined');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const messageMutation = useMutation({
    mutationFn: ({ swapId, message }: { swapId: string; message: string }) =>
      api.post(`/swaps/${swapId}/messages`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
      setMessageText('');
      toast.success('Message sent');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const swaps = (householdId ? swapsData?.data : mySwaps?.data) || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Swap Center"
          description="Request and manage chore swaps"
          icon={<ArrowLeftRight className="h-5 w-5" />}
          actions={
            <Button variant="outline" size="sm" onClick={() => setShowRequest(!showRequest)}>
              <ArrowLeftRight className="mr-1 h-3.5 w-3.5" /> Request Swap
            </Button>
          }
        />

        <div className="flex gap-2">
          <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[140px]" />
        </div>

        {showRequest && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
              <CardHeader><CardTitle>New Swap Request</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select label="Your chore" placeholder="Choose a chore to swap" value={reqChoreId} onChange={(e) => setReqChoreId(e.target.value)}
                    options={chores?.data?.map((c: any) => ({ value: c.id, label: c.title })) || []} />
                  <Select label="Swap with" placeholder="Select a member" value={reqTargetId} onChange={(e) => setReqTargetId(e.target.value)}
                    options={household?.data?.members?.map((m: any) => ({ value: m.user.id, label: m.user.displayName || `${m.user.firstName} ${m.user.lastName}` })) || []} />
                  <Input label="Reason (optional)" placeholder="Why do you want to swap?" value={reqReason} onChange={(e) => setReqReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button onClick={() => requestMutation.mutate()} isLoading={requestMutation.isPending}>
                      <Send className="mr-1 h-3.5 w-3.5" /> Send Request
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowRequest(false)}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="space-y-3">
          {swaps.length === 0 ? (
            <EmptyState
              icon={<ArrowLeftRight className="h-7 w-7" />}
              title="No swap requests"
              description="Create a swap request to get started"
            />
          ) : (
            swaps.map((swap: Swap) => (
              <motion.div key={swap.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig[swap.status]?.color || ''}`}>
                            {statusConfig[swap.status]?.label || swap.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(swap.createdAt)} at {formatTime(swap.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={`${swap.requester.firstName} ${swap.requester.lastName}`} size="sm" />
                            <div>
                              <p className="text-sm font-medium">
                                {swap.requester.displayName || `${swap.requester.firstName} ${swap.requester.lastName}`}
                              </p>
                              <p className="text-xs text-muted-foreground">{swap.originalChore.title}</p>
                            </div>
                          </div>

                          <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />

                          <div className="flex items-center gap-2">
                            <Avatar name={`${swap.requestedTo.firstName} ${swap.requestedTo.lastName}`} size="sm" />
                            <div>
                              <p className="text-sm font-medium">
                                {swap.requestedTo.displayName || `${swap.requestedTo.firstName} ${swap.requestedTo.lastName}`}
                              </p>
                              {swap.alternateChore && <p className="text-xs text-muted-foreground">{swap.alternateChore.title}</p>}
                            </div>
                          </div>
                        </div>

                        {swap.reason && (
                          <p className="mt-2 text-sm text-muted-foreground italic">&ldquo;{swap.reason}&rdquo;</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {swap.status === 'PENDING' && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => respondMutation.mutate({ swapId: swap.id, decision: 'ACCEPTED' })}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => respondMutation.mutate({ swapId: swap.id, decision: 'DECLINED' })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowMessage(showMessage === swap.id ? null : swap.id)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {showMessage === swap.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t space-y-3">
                        {swap.messages?.map((msg: any) => (
                          <div key={msg.id} className="flex items-start gap-2">
                            <span className="text-xs font-medium shrink-0">{msg.sender.displayName || msg.sender.firstName}:</span>
                            <p className="text-sm text-muted-foreground">{msg.message}</p>
                          </div>
                        ))}
                        <form onSubmit={(e) => { e.preventDefault(); if (messageText.trim()) messageMutation.mutate({ swapId: swap.id, message: messageText }); }} className="flex gap-2">
                          <Input placeholder="Type a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} className="flex-1" />
                          <Button type="submit" size="sm" isLoading={messageMutation.isPending}><Send className="h-3.5 w-3.5" /></Button>
                        </form>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
