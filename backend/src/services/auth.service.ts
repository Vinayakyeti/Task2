import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository.js';
import { RegisterInput, LoginInput } from '../dtos/auth.dto.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

export const authService = {
  async register(input: RegisterInput) {
    const exists = await userRepository.findByEmail(input.email);
    if (exists) throw new ValidationError('Email already registered');
    
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userRepository.create({ name: input.name, email: input.email, passwordHash });
    return { id: user._id, name: user.name, email: user.email };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid credentials');
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { id: user._id, name: user.name, email: user.email } };
  },

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  },
};
