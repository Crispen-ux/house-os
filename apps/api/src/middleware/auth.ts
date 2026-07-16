import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@house-os/database';
import { AppError } from './error-handler';

export interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { role?: string };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError(401, 'No token provided');
    }

    const secret = process.env.JWT_SECRET || 'change-me-in-production';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive');
    }

    req.user = { userId: user.id, email: user.email };
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, 'Invalid or expired token'));
    }
  }
}

export function requireHouseholdRole(...roles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const householdId = req.params.householdId || req.body.householdId;
      if (!householdId) {
        throw new AppError(400, 'Household ID required');
      }

      const member = await prisma.householdMember.findUnique({
        where: {
          householdId_userId: {
            householdId,
            userId: req.user!.userId,
          },
        },
      });

      if (!member || !member.isActive) {
        throw new AppError(403, 'Not a member of this household');
      }

      if (roles.length > 0 && !roles.includes(member.role)) {
        throw new AppError(403, 'Insufficient permissions');
      }

      req.user!.role = member.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}
