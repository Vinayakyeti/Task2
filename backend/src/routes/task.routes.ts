import { Router } from 'express';
import { taskController } from '../controllers/task.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.post('/', taskController.createTask);
taskRouter.get('/', taskController.getTasks);
taskRouter.get('/:id', taskController.getTaskById);
taskRouter.put('/:id', taskController.updateTask);
taskRouter.delete('/:id', taskController.deleteTask);
