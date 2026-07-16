'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, ListChecks, Repeat, ArrowLeftRight,
  ShoppingCart, Calendar, Bell, Bot, BarChart3, Trophy, Settings, Home, LogOut,
  ChevronLeft, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Households', href: '/households', icon: Home },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Chores', href: '/chores', icon: ListChecks },
  { label: 'Rotations', href: '/rotations', icon: Repeat },
  { label: 'Swap Center', href: '/swaps', icon: ArrowLeftRight },
  { label: 'Shopping', href: '/shopping', icon: ShoppingCart },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'AI Assistant', href: '/ai', icon: Bot },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
];

const bottomItems = [
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen border-r bg-sidebar-bg flex flex-col transition-all duration-300 ease-out',
      collapsed ? 'w-[68px]' : 'w-60',
      'hidden lg:flex',
    )}>
      <div className={cn(
        'flex items-center h-16 border-b border-sidebar-border transition-all duration-300',
        collapsed ? 'justify-center px-2' : 'gap-3 px-5',
      )}>
        {!collapsed && (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-[10px] font-bold text-primary-foreground">HO</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold tracking-tight truncate">Household OS</p>
            </div>
          </>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-[10px] font-bold text-primary-foreground">HO</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer',
            collapsed && 'hidden',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-fg'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-fg',
              )}
            >
              <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-foreground')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-fg'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-fg',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        <div className={cn(
          'mt-2 rounded-xl bg-surface-hover transition-all duration-300',
          collapsed ? 'p-2' : 'p-3',
        )}>
          <div className={cn(
            'flex items-center gap-3',
            collapsed && 'justify-center',
          )}>
            <Avatar
              name={user?.displayName || user?.firstName || 'U'}
              src={user?.avatarUrl}
              size="sm"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName || user?.firstName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
