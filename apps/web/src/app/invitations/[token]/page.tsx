'use client';

import { use, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Home, Users, Mail, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type InvitationStatus = 'loading' | 'valid' | 'accepted' | 'declined' | 'expired' | 'error';

export default function InvitationAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<InvitationStatus>('loading');
  const [message, setMessage] = useState('');

  const { data: invitation, isLoading, error: queryError } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => api.get<{ success: boolean; data: any }>(`/invitations/by-token/${token}`),
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;
    if (invitation) {
      setStatus('valid');
    } else if (queryError) {
      const err = queryError as any;
      if (err.message?.includes('expired')) {
        setStatus('expired');
      } else if (err.message?.includes('already been processed')) {
        setStatus('accepted');
      } else {
        setStatus('error');
        setMessage(err.message || 'Invalid invitation');
      }
    }
  }, [invitation, queryError, isLoading]);

  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/invitations/accept/${token}`),
    onSuccess: () => {
      setStatus('accepted');
    },
    onError: (err: any) => {
      setMessage(err.message || 'Failed to accept invitation');
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => api.post(`/invitations/decline/${token}`),
    onSuccess: () => {
      setStatus('declined');
    },
    onError: (err: any) => {
      setMessage(err.message || 'Failed to decline invitation');
    },
  });

  const handleAccept = () => {
    if (!user) {
      window.location.href = `/auth/login?redirect=/invitations/${token}`;
      return;
    }
    acceptMutation.mutate();
  };

  const handleDecline = () => {
    declineMutation.mutate();
  };

  if (authLoading || isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-950 mb-4">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h1 className="text-lg font-semibold mb-2">Invalid Invitation</h1>
              <p className="text-sm text-muted-foreground mb-6">
                {message || 'This invitation link is not valid.'}
              </p>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950 mb-4">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
              <h1 className="text-lg font-semibold mb-2">Invitation Expired</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This invitation has expired. Please ask the household admin to send a new one.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-surface-hover mb-4">
                <XCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <h1 className="text-lg font-semibold mb-2">Invitation Declined</h1>
              <p className="text-sm text-muted-foreground mb-6">
                You have declined this invitation.
              </p>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 mb-4">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <h1 className="text-lg font-semibold mb-2">Welcome to the Household!</h1>
              <p className="text-sm text-muted-foreground mb-6">
                You are now a member of <strong>{invitation?.data?.household?.name}</strong>.
              </p>
              <Link href="/dashboard">
                <Button size="sm">Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const inv = invitation?.data;
  const householdName = inv?.household?.name || 'Household';
  const inviterName = inv?.invitedBy?.displayName || `${inv?.invitedBy?.firstName} ${inv?.invitedBy?.lastName}` || 'Someone';
  const roleLabel = inv?.role ? inv.role.charAt(0) + inv.role.slice(1).toLowerCase() : 'Member';
  const expiryDate = inv?.expiresAt
    ? new Date(inv.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-surface-hover mb-4">
                <Home className="h-7 w-7" />
              </div>
              <h1 className="text-lg font-semibold mb-1">Join {householdName}</h1>
              <p className="text-sm text-muted-foreground">
                {inviterName} invited you to join
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>Household</span>
                </div>
                <span className="text-sm font-medium">{householdName}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Role</span>
                </div>
                <Badge variant={inv?.role === 'OWNER' ? 'default' : inv?.role === 'ADMIN' ? 'info' : 'secondary'}>
                  {roleLabel}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Sent to</span>
                </div>
                <span className="text-sm font-medium">{inv?.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-hover">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Expires</span>
                </div>
                <span className="text-sm font-medium">{expiryDate}</span>
              </div>
            </div>

            {inv?.message && (
              <div className="p-3 rounded-lg bg-surface-hover mb-6">
                <p className="text-sm text-muted-foreground italic">&ldquo;{inv.message}&rdquo;</p>
              </div>
            )}

            {message && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="sm"
                onClick={handleAccept}
                isLoading={acceptMutation.isPending}
              >
                {user ? 'Accept Invitation' : 'Sign in to Accept'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecline}
                isLoading={declineMutation.isPending}
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
