'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { InviteMemberModal } from '@/components/invite-member-modal';
import { Users, UserPlus, Mail, Clock, XCircle, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function MembersPage() {
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const [showInvite, setShowInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: household, isLoading } = useQuery({
    queryKey: ['household', householdId],
    queryFn: () => api.get<{ success: boolean; data: any }>(`/households/${householdId}`),
    enabled: !!householdId,
  });

  const { data: invitations } = useQuery({
    queryKey: ['invitations', householdId],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(`/invitations/${householdId}`),
    enabled: !!householdId,
  });

  const members = household?.data?.members || [];
  const pendingInvitations = invitations?.data?.filter((inv: any) => inv.status === 'PENDING') || [];

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invitations/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Invite link copied!');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Members"
          description={`${user?.primaryHousehold?.name ?? 'Your household'} members`}
          icon={<Users className="h-5 w-5" />}
          actions={
            householdId ? (
              <Button size="sm" onClick={() => setShowInvite(true)}>
                <UserPlus className="mr-1 h-3.5 w-3.5" /> Invite
              </Button>
            ) : undefined
          }
        />

        {!householdId ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No household selected"
            description="Create or join a household first"
          />
        ) : isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : members.length === 0 && pendingInvitations.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No members yet"
            description="Invite people to join your household"
            action={
              <Button onClick={() => setShowInvite(true)} size="sm">
                <UserPlus className="mr-1 h-3.5 w-3.5" /> Invite Member
              </Button>
            }
          />
        ) : (
          <>
            <motion.div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" variants={container} initial="hidden" animate="show">
              {members.map((member: any) => (
                <motion.div key={member.id} variants={item}>
                  <Card className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar
                        name={member.user?.displayName || `${member.user?.firstName} ${member.user?.lastName}`}
                        src={member.user?.avatarUrl}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {member.user?.displayName || `${member.user?.firstName} ${member.user?.lastName}`}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
                        <Badge
                          variant={member.role === 'OWNER' ? 'default' : member.role === 'ADMIN' ? 'info' : 'secondary'}
                          className="mt-2"
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {pendingInvitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Pending Invitations</h3>
                <motion.div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" variants={container} initial="hidden" animate="show">
                  {pendingInvitations.map((inv: any) => (
                    <motion.div key={inv.id} variants={item}>
                      <Card className="p-5 border-dashed">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950 shrink-0">
                              <Mail className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{inv.email}</p>
                              <p className="text-xs text-muted-foreground">Invited as {inv.role}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Expires {new Date(inv.expiresAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => copyInviteLink(inv.token)}
                            className="rounded-md p-1.5 hover:bg-surface-hover transition-colors shrink-0"
                            title="Copy invite link"
                          >
                            {copiedToken === inv.token
                              ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                              : <Copy className="h-4 w-4 text-muted-foreground" />
                            }
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>

      {householdId && (
        <InviteMemberModal
          householdId={householdId}
          open={showInvite}
          onClose={() => setShowInvite(false)}
        />
      )}
    </AppShell>
  );
}
