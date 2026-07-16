'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, Users, Settings, ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function HouseholdDetailPage() {
  const params = useParams();
  const householdId = params.id as string;

  const { data: household, isLoading } = useQuery({
    queryKey: ['household', householdId],
    queryFn: () => api.get<{ success: boolean; data: any }>(`/households/${householdId}`),
    enabled: !!householdId,
  });

  const h = household?.data;

  if (isLoading) return <AppShell><div className="text-center py-20 text-muted-foreground">Loading...</div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/households">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{h?.name || 'Household'}</h1>
          </div>
          <Link href="/members">
            <Button variant="outline" size="sm">
              <UserPlus className="mr-1 h-4 w-4" /> Invite
            </Button>
          </Link>
          <Link href={`/settings?household=${householdId}`}>
            <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Chores', href: `/chores?household=${householdId}` },
            { label: 'Swaps', href: `/swaps?household=${householdId}` },
            { label: 'Leaderboard', href: `/leaderboard?household=${householdId}` },
            { label: 'Shopping', href: `/shopping?household=${householdId}` },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <p className="font-medium">{item.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {h?.members?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {m.user?.firstName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.user?.displayName || `${m.user?.firstName} ${m.user?.lastName}`}</p>
                      <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                    </div>
                  </div>
                  <Badge variant={m.role}>{m.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
