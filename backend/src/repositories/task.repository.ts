import { Task, ITask } from '../models/task.model.js';
import mongoose from 'mongoose';

export const taskRepository = {
  create: (data: {
    title: string;
    description: string;
    dueDate: Date;
    priority: string;
    status?: string;
    creatorId: string;
    assignedToId?: string;
  }) => Task.create(data),

  findById: (id: string) => Task.findById(id).populate('creatorId assignedToId', 'name email'),

  findAll: (filters: any, sort: any) => Task.find(filters).sort(sort).populate('creatorId assignedToId', 'name email'),

  update: (id: string, data: Partial<ITask>) => Task.findByIdAndUpdate(id, data, { new: true }).populate('creatorId assignedToId', 'name email'),

  delete: (id: string) => Task.findByIdAndDelete(id),
};
