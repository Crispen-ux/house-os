import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie('accessToken', tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
  res.cookie('refreshToken', tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { path: '/', httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax' });
  res.clearCookie('refreshToken', { path: '/', httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax' });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, displayName } = req.body;
    const result = await authService.register(email, password, firstName, lastName, displayName);
    setAuthCookies(res, result.tokens);
    res.status(201).json({ success: true, data: { user: result.user } });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    setAuthCookies(res, result.tokens);
    res.json({ success: true, data: { user: result.user } });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }
    const tokens = await authService.refreshAccessToken(refreshToken);
    setAuthCookies(res, tokens);
    res.json({ success: true, data: { tokens } });
  } catch (error) {
    next(error);
  }
}

export function logout(_req: Request, res: Response) {
  clearAuthCookies(res);
  res.json({ success: true, data: { message: 'Logged out' } });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
