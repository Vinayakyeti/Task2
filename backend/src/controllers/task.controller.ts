import { Response, NextFunction } from 'express';
import { taskService } from '../services/task.service.js';
import { CreateTaskDto, UpdateTaskDto } from '../dtos/task.dto.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const taskController = {
  async createTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = CreateTaskDto.parse(req.body);
      const task = await taskService.createTask(data, req.userId!);
      res.status(201).json(task);
    } catch (e) {
      next(e);
    }
  },

  async getTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tasks = await taskService.getTasks(req.userId!, req.query);
      res.json(tasks);
    } catch (e) {
      next(e);
    }
  },

  async getTaskById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getTaskById(req.params.id);
      res.json(task);
    } catch (e) {
      next(e);
    }
  },

  async updateTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = UpdateTaskDto.parse(req.body);
      const task = await taskService.updateTask(req.params.id, data, req.userId!);
      res.json(task);
    } catch (e) {
      next(e);
    }
  },

  async deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await taskService.deleteTask(req.params.id, req.userId!);
      res.json({ message: 'Task deleted successfully' });
    } catch (e) {
      next(e);
    }
  },
};
