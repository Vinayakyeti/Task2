import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { RegisterDto, LoginDto } from '../dtos/auth.dto.js';

const COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 };

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = RegisterDto.parse(req.body);
      const user = await authService.register(data);
      res.status(201).json(user);
    } catch (e) {
      next(e);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = LoginDto.parse(req.body);
      const { token, user } = await authService.login(data);
      res.cookie('token', token, COOKIE_OPTIONS).json(user);
    } catch (e) {
      next(e);
    }
  },

  logout(_req: Request, res: Response) {
    res.clearCookie('token').json({ message: 'Logged out' });
  },
};
