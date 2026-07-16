'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

export default function CalendarPage() {
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: events } = useQuery({
    queryKey: ['calendar', householdId, startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: () => api.get<{ success: boolean; data: any[] }>(
      `/calendar/${householdId}?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
    ),
    enabled: !!householdId,
  });

  const daysInMonth = endOfMonth.getDate();
  const firstDayOfWeek = startOfMonth.getDay();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const eventsByDay: Record<number, any[]> = {};
  events?.data?.forEach((e) => {
    const day = new Date(e.date).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Calendar"
          description="Household schedule at a glance"
          icon={<CalendarDays className="h-5 w-5" />}
        />

        {!householdId ? (
          <EmptyState
            icon={<CalendarDays className="h-7 w-7" />}
            title="No household"
            description="Create or join a household first"
          />
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-px">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-2">{d}</div>
                  ))}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
                    const dayEvents = eventsByDay[day] || [];
                    return (
                      <div
                        key={day}
                        className={cn(
                          'min-h-[72px] p-1.5 border rounded-lg text-sm transition-colors',
                          isToday ? 'border-primary/30 bg-primary/5' : 'hover:bg-surface-hover',
                        )}
                      >
                        <span className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                          isToday ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground',
                        )}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((e: any) => (
                            <div key={e.id} className="text-[10px] px-1 py-0.5 rounded bg-surface-hover truncate">
                              {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 2}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
