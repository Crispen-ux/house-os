'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'Who cooks today?',
  'What chores are overdue?',
  'Swap my chores with Sarah',
  'Show this week\'s schedule',
  'Who forgot to wash dishes?',
];

export default function AiPage() {
  const { user } = useAuth();
  const householdId = user?.primaryHousehold?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const queryMutation = useMutation({
    mutationFn: (prompt: string) =>
      api.post<{ success: boolean; data: { response: string } }>('/ai/query', { prompt, householdId }),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.data.response }]);
    },
    onError: (err: any) => {
      toast.error(err.message);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !householdId) {
      if (!householdId) toast.error('Enter a Household ID first');
      return;
    }
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    queryMutation.mutate(input);
    setInput('');
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="AI Assistant"
          description="Ask anything about your household"
          icon={<Bot className="h-5 w-5" />}
        />

        {!householdId ? (
          <EmptyState
            icon={<Bot className="h-7 w-7" />}
            title="No household"
            description="Create or join a household first"
          />
        ) : (
          <>
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setMessages([{ role: 'user', content: s }]);
                    queryMutation.mutate(s);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3.5 py-2 text-sm hover:bg-surface-hover hover:shadow-surface transition-all duration-150 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <Card className="min-h-[400px] max-h-[600px] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <Avatar name="AI" size="sm" />
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-surface-hover text-foreground rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <Avatar name="You" size="sm" />
                )}
              </motion.div>
            ))}
            {queryMutation.isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <Avatar name="AI" size="sm" />
                <div className="rounded-2xl rounded-bl-md bg-surface-hover px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="Ask about chores, swaps, schedules..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={queryMutation.isPending}
                className="flex-1"
              />
              <Button type="submit" size="icon" isLoading={queryMutation.isPending} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
