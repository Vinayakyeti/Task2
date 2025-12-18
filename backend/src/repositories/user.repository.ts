import { User, IUser } from '../models/user.model.js';

export const userRepository = {
  findByEmail: (email: string) => User.findOne({ email }),
  create: (data: { name: string; email: string; passwordHash: string }) => User.create(data),
  findById: (id: string) => User.findById(id).select('-passwordHash'),
};
