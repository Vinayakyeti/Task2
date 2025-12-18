import { taskRepository } from '../repositories/task.repository.js';
import { CreateTaskInput, UpdateTaskInput } from '../dtos/task.dto.js';
import { emitTaskStatusChange, emitTaskPriorityChange, emitTaskAssigneeChange } from '../socket.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export const taskService = {
  async createTask(input: CreateTaskInput, creatorId: string) {
    const task = await taskRepository.create({
      ...input,
      dueDate: new Date(input.dueDate),
      creatorId,
    });
    const createdTask = await taskRepository.findById(task._id.toString());
    
    if (input.assignedToId) {
      emitTaskAssigneeChange(task._id.toString(), undefined, input.assignedToId, createdTask);
    }
    
    return createdTask;
  },

  async getTasks(userId: string, query: any) {
    const filters: any = {};
    
    if (query.status) filters.status = query.status;
    if (query.priority) filters.priority = query.priority;
    if (query.assignedToId) filters.assignedToId = query.assignedToId;
    if (query.creatorId) filters.creatorId = query.creatorId;

    const sort: any = {};
    if (query.sortBy) {
      const order = query.order === 'desc' ? -1 : 1;
      sort[query.sortBy] = order;
    } else {
      sort.createdAt = -1;
    }

    return taskRepository.findAll(filters, sort);
  },

  async getTaskById(id: string) {
    const task = await taskRepository.findById(id);
    if (!task) throw new NotFoundError('Task not found');
    return task;
  },

  async updateTask(id: string, input: UpdateTaskInput, userId: string) {
    const task = await taskRepository.findById(id);
    if (!task) throw new NotFoundError('Task not found');

    const oldStatus = task.status;
    const oldPriority = task.priority;
    const oldAssigneeId = task.assignedToId?.toString();

    const updateData: any = { ...input };
    if (input.dueDate) {
      updateData.dueDate = new Date(input.dueDate);
    }

    const updatedTask = await taskRepository.update(id, updateData);

    if (input.status && input.status !== oldStatus) {
      emitTaskStatusChange(id, oldStatus, input.status, updatedTask);
    }

    if (input.priority && input.priority !== oldPriority) {
      emitTaskPriorityChange(id, oldPriority, input.priority, updatedTask);
    }

    if (input.assignedToId !== undefined && input.assignedToId !== oldAssigneeId) {
      emitTaskAssigneeChange(id, oldAssigneeId, input.assignedToId, updatedTask);
    }

    return updatedTask;
  },

  async deleteTask(id: string, userId: string) {
    const task = await taskRepository.findById(id);
    if (!task) throw new NotFoundError('Task not found');
    if (task.creatorId.toString() !== userId) {
      throw new ForbiddenError('Only the creator can delete this task');
    }
    await taskRepository.delete(id);
  },
};
