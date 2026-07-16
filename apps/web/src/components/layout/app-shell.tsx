'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-60 transition-all duration-300">
        <Header />
        <main className="p-4 lg:p-6 animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  );
}
