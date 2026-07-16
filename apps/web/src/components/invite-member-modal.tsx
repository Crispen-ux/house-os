'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { X, Send, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface InviteMemberModalProps {
  householdId: string;
  open: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { value: 'ADULT', label: 'Adult' },
  { value: 'TEEN', label: 'Teen' },
  { value: 'CHILD', label: 'Child' },
  { value: 'GUEST', label: 'Guest' },
];

export function InviteMemberModal({ householdId, open, onClose }: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADULT');
  const [message, setMessage] = useState('');

  const inviteMutation = useMutation({
    mutationFn: () =>
      api.post(`/invitations/${householdId}`, {
        email,
        role,
        message: message || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', householdId] });
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      setRole('ADULT');
      setMessage('');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to send invitation');
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-overlay/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
        className="relative"
      >
        <Card className="w-full max-w-md mx-4 shadow-lg">
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hover">
                <Mail className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold">Invite Member</h2>
            </div>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-surface-hover transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="person@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Message (optional)</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-lg border bg-surface px-3 py-2 text-sm transition-colors duration-150 hover:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring/40 resize-none"
                  placeholder="Add a personal message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1" size="sm" isLoading={inviteMutation.isPending}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Send Invitation
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
