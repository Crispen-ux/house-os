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
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeletons';
import { toast } from 'sonner';
import { ListChecks, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

const categoryOptions = [
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'LAUNDRY', label: 'Laundry' },
  { value: 'GARDEN', label: 'Garden' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'PETS', label: 'Pets' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'CUSTOM', label: 'Custom' },
];

const recurrenceOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'ONE_TIME', label: 'One Time' },
];

export default function ChoresPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('CUSTOM');
  const [recurrence, setRecurrence] = useState('DAILY');
  const [points, setPoints] = useState('10');
  const [description, setDescription] = useState('');

  const [assignChoreId, setAssignChoreId] = useState('');
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const { data: chores, isLoading: choresLoading } = useQuery({
    queryKey: ['chores', householdId],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(`/chores/household/${householdId}`),
    enabled: !!householdId,
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', householdId, filterStatus],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(`/chores/assignments/${householdId}${filterStatus ? `?status=${filterStatus}` : ''}`),
    enabled: !!householdId,
  });

  const { data: household } = useQuery({
    queryKey: ['household', householdId],
    queryFn: () => api.get<{ success: boolean; data: any }>(`/households/${householdId}`),
    enabled: !!householdId && showAssign,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/chores', { householdId, title, category, recurrence, points: parseInt(points), description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      setShowCreate(false); setTitle(''); setDescription(''); setPoints('10');
      toast.success('Chore created!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: () => api.post('/chores/assign', { choreId: assignChoreId, assigneeId: assignMemberId, dueDate: assignDueDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setShowAssign(false); setAssignChoreId(''); setAssignMemberId(''); setAssignDueDate('');
      toast.success('Chore assigned!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/chores/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Task completed!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const skipMutation = useMutation({
    mutationFn: (id: string) => api.post(`/chores/${id}/skip`, { reason: 'Manual skip' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Task skipped');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Chores"
          description="Create, assign, and track chores"
          icon={<ListChecks className="h-5 w-5" />}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAssign(!showAssign); setShowCreate(false); }}>Assign</Button>
              <Button size="sm" onClick={() => { setShowCreate(!showCreate); setShowAssign(false); }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Create
              </Button>
            </div>
          }
        />

        <div className="flex gap-2">
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'OVERDUE', label: 'Overdue' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="max-w-[140px]"
          />
        </div>

        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    <Select label="Category" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
                    <Select label="Recurrence" options={recurrenceOptions} value={recurrence} onChange={(e) => setRecurrence(e.target.value)} />
                    <Input label="Points" type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
                  </div>
                  <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                  <div className="flex gap-2">
                    <Button onClick={() => createMutation.mutate()} isLoading={createMutation.isPending}>Create Chore</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showAssign && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <Select label="Chore" placeholder="Select chore" options={chores?.data?.map((c: any) => ({ value: c.id, label: c.title })) || []} value={assignChoreId} onChange={(e) => setAssignChoreId(e.target.value)} />
                    <Select label="Member" placeholder="Select member" options={household?.data?.members?.map((m: any) => ({ value: m.user.id, label: m.user.displayName || `${m.user.firstName} ${m.user.lastName}` })) || []} value={assignMemberId} onChange={(e) => setAssignMemberId(e.target.value)} />
                    <Input label="Due Date" type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => assignMutation.mutate()} isLoading={assignMutation.isPending}>Assign</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAssign(false)}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!householdId ? (
          <EmptyState icon={<ListChecks className="h-7 w-7" />} title="No household" description="Create or join a household first" />
        ) : (
          <>
          <Card>
            <CardHeader>
              <CardTitle>Chore Templates ({chores?.data?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {choresLoading ? <SkeletonList count={3} /> : (!chores?.data || chores.data.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">No chores created yet</p>
              ) : (
                <div className="space-y-1">
                  {chores.data.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-hover transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant={c.category}>{c.category}</Badge>
                        <span className="font-medium text-sm">{c.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{c.points} pts</span>
                        <span>{c.recurrence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Tasks ({assignments?.data?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? <SkeletonList count={3} /> : (!assignments?.data || assignments.data.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks assigned</p>
              ) : (
                <div className="space-y-1">
                  {assignments.data.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-hover transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant={a.status} dot>{a.status}</Badge>
                        <div>
                          <p className="text-sm font-medium">{a.chore?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.assignee?.displayName || a.assignee?.firstName} · {formatDate(a.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {a.status === 'PENDING' && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => completeMutation.mutate(a.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => skipMutation.mutate(a.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {a.status === 'COMPLETED' && a.completedAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(a.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
