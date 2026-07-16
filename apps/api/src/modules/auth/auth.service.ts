import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@house-os/database';
import { AppError } from '../../middleware/error-handler';
import { AuthResponse, TokenPair } from './auth.types';

function generateTokens(userId: string, email: string): TokenPair {
  const secret = process.env.JWT_SECRET || 'change-me-in-production';
  const accessToken = jwt.sign({ userId, email }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId, email, type: 'refresh' }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

function sanitizeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  return user;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  displayName?: string,
): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  const tokens = generateTokens(user.id, user.email);

  await prisma.userSetting.create({
    data: { userId: user.id },
  });

  return { user, tokens };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (!user.passwordHash) {
    throw new AppError(401, 'This account uses social login');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = generateTokens(user.id, user.email);

  return {
    user: sanitizeUser(user),
    tokens,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  try {
    const secret = process.env.JWT_SECRET || 'change-me-in-production';
    const decoded = jwt.verify(refreshToken, secret) as { userId: string; email: string; type: string };

    if (decoded.type !== 'refresh') {
      throw new AppError(401, 'Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive');
    }

    return generateTokens(user.id, decoded.email);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'Invalid or expired refresh token');
  }
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      phone: true,
      dateOfBirth: true,
      timezone: true,
      locale: true,
      createdAt: true,
      households: {
        where: { isActive: true },
        select: {
          household: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!user) throw new AppError(404, 'User not found');

  const primaryHousehold = user.households[0]?.household ?? null;

  return {
    ...user,
    primaryHousehold,
  };
}

export async function updateProfile(userId: string, data: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  dateOfBirth?: string;
  timezone?: string;
  locale?: string;
}) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      phone: true,
      dateOfBirth: true,
      timezone: true,
      locale: true,
    },
  });
}
