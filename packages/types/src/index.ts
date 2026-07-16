import type {
  User,
  Household,
  HouseholdMember,
  Chore,
  TaskAssignment,
  Rotation,
  RotationRule,
  ShoppingList,
  ShoppingItem,
  ChoreSwap,
  SwapMessage,
  SwapHistory,
  Notification,
  Achievement,
  Badge,
  UserAchievement,
  UserBadge,
  PointsHistory,
  Leaderboard,
  LeaderboardEntry,
  ChatMessage,
  AiConversation,
  UserSetting,
  HouseholdSetting,
  AuditLog,
  MealPlan,
  Recipe,
  PetCareSchedule,
  MaintenanceReminder,
  ElectricityReading,
  WaterReading,
  MedicineReminder,
  VisitorLog,
  EmergencyContact,
  ExpenseEntry,
  Subscription,
  RoleType,
  ChoreCategory,
  RecurrenceType,
  TaskStatus,
  SwapStatus,
  NotificationType,
  NotificationChannel,
  LeaderboardType,
} from '@prisma/client';

export type {
  User,
  Household,
  HouseholdMember,
  Chore,
  TaskAssignment,
  Rotation,
  RotationRule,
  ShoppingList,
  ShoppingItem,
  ChoreSwap,
  SwapMessage,
  SwapHistory,
  Notification,
  Achievement,
  Badge,
  UserAchievement,
  UserBadge,
  PointsHistory,
  Leaderboard,
  LeaderboardEntry,
  ChatMessage,
  AiConversation,
  UserSetting,
  HouseholdSetting,
  AuditLog,
  MealPlan,
  Recipe,
  PetCareSchedule,
  MaintenanceReminder,
  ElectricityReading,
  WaterReading,
  MedicineReminder,
  VisitorLog,
  EmergencyContact,
  ExpenseEntry,
  Subscription,
  RoleType,
  ChoreCategory,
  RecurrenceType,
  TaskStatus,
  SwapStatus,
  NotificationType,
  NotificationChannel,
  LeaderboardType,
};

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SwapRequestInput {
  choreId: string;
  targetMemberId: string;
  alternateChoreId?: string;
  reason?: string;
}

export interface SwapDecisionInput {
  status: 'ACCEPTED' | 'DECLINED';
  alternateChoreId?: string;
}

export interface AiQueryInput {
  prompt: string;
  householdId: string;
}

export interface DashboardStats {
  todayDate: string;
  todayCooking: TaskAssignment[];
  todayDishes: TaskAssignment[];
  todayChores: TaskAssignment[];
  upcomingTasks: TaskAssignment[];
  progressPercent: number;
  householdActivity: AuditLog[];
  leaderboard: LeaderboardEntry[];
  recentNotifications: Notification[];
  upcomingBirthdays: User[];
}

export interface CreateChoreInput {
  householdId: string;
  category: ChoreCategory;
  customCategory?: string;
  title: string;
  description?: string;
  instructions?: string;
  points?: number;
  penaltyPoints?: number;
  recurrence: RecurrenceType;
  isRestricted?: boolean;
  requiresAdult?: boolean;
  estimatedMinutes?: number;
}

export interface AssignChoreInput {
  choreId: string;
  assigneeId: string;
  dueDate: string;
}
