'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Home, Users, Bot, Trophy, Calendar, ShoppingCart, Repeat, BarChart3, Sparkles, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Home, title: 'Chore Management', description: 'Create, assign, and track chores with automated rotations', color: 'text-amber-600 dark:text-amber-400' },
  { icon: Users, title: 'Household Roles', description: 'Manage members with role-based permissions', color: 'text-violet-600 dark:text-violet-400' },
  { icon: ArrowLeftRight, title: 'Chore Swaps', description: 'Request and accept chore swaps with ease', color: 'text-sky-600 dark:text-sky-400' },
  { icon: Bot, title: 'AI Assistant', description: 'Natural language chat to manage your household', color: 'text-emerald-600 dark:text-emerald-400' },
  { icon: Trophy, title: 'Rewards & Points', description: 'Gamified system with achievements and leaderboards', color: 'text-amber-600 dark:text-amber-400' },
  { icon: Calendar, title: 'Smart Calendar', description: 'Monthly, weekly, and daily views with drag & drop', color: 'text-blue-600 dark:text-blue-400' },
  { icon: ShoppingCart, title: 'Shopping Lists', description: 'Shared lists with price tracking and barcode scanning', color: 'text-pink-600 dark:text-pink-400' },
  { icon: Repeat, title: 'Rotations', description: 'Automated chore rotations to keep things fair', color: 'text-orange-600 dark:text-orange-400' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass border-b border-glass-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-[10px] font-bold text-primary-foreground">HO</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">Household OS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <motion.section
        className="container mx-auto px-4 pt-24 pb-20 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-1.5 text-sm mb-8 shadow-surface">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Making Home Management</span>
          <span className="font-semibold">Simple, Fair and Fun</span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1]">
          Your Household,{' '}
          <span className="text-gradient">
            Perfectly Organized
          </span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          From daily chores to meal planning, shopping lists to rewards — Household OS brings everything together in one beautiful, intelligent platform.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/auth/register">
            <Button size="lg" className="text-base px-8">
              Start Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="text-base px-8">
              Sign In
            </Button>
          </Link>
        </div>
      </motion.section>

      <motion.section
        className="container mx-auto px-4 pb-24"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              className="group rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover mb-4 ${feature.color}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <footer className="border-t border-border/60">
        <div className="container mx-auto px-4 py-8 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Household OS</p>
          <p className="text-xs text-muted-foreground">Built with care</p>
        </div>
      </footer>
    </div>
  );
}
