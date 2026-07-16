export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type {
  User,
  Household,
  HouseholdMember,
  Chore,
  TaskAssignment,
  ChoreSwap,
  ShoppingList,
  ShoppingItem,
  Notification,
  Achievement,
  Badge,
  PointsHistory,
  Leaderboard,
  LeaderboardEntry,
  AuditLog,
  DashboardStats,
} from '@house-os/types';
