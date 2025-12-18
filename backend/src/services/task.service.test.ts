import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TaskPriority, TaskStatus } from '../models/task.model';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const mockCreate = jest.fn() as jest.MockedFunction<any>;
const mockFindById = jest.fn() as jest.MockedFunction<any>;
const mockFindAll = jest.fn() as jest.MockedFunction<any>;
const mockUpdate = jest.fn() as jest.MockedFunction<any>;
const mockDelete = jest.fn() as jest.MockedFunction<any>;
const mockEmitTaskAssigneeChange = jest.fn() as jest.MockedFunction<any>;
const mockEmitTaskStatusChange = jest.fn() as jest.MockedFunction<any>;
const mockEmitTaskPriorityChange = jest.fn() as jest.MockedFunction<any>;

jest.unstable_mockModule('../repositories/task.repository', () => ({
  taskRepository: {
    create: mockCreate,
    findById: mockFindById,
    findAll: mockFindAll,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

jest.unstable_mockModule('../socket', () => ({
  emitTaskAssigneeChange: mockEmitTaskAssigneeChange,
  emitTaskStatusChange: mockEmitTaskStatusChange,
  emitTaskPriorityChange: mockEmitTaskPriorityChange,
}));

const { taskService } = await import('../services/task.service');

describe('Task Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task with valid input', async () => {
      const mockTask = {
        _id: '123',
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date('2025-12-31'),
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        creatorId: 'user123',
      };

      const input = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: '2025-12-31T00:00:00.000Z',
        priority: TaskPriority.HIGH,
      };

      mockCreate.mockResolvedValue(mockTask);
      mockFindById.mockResolvedValue(mockTask);

      const result = await taskService.createTask(input, 'user123');

      expect(mockCreate).toHaveBeenCalledWith({
        ...input,
        dueDate: new Date(input.dueDate),
        creatorId: 'user123',
      });
      expect(result).toEqual(mockTask);
    });

    it('should emit assignment event when task is assigned during creation', async () => {
      const mockTask = {
        _id: '123',
        title: 'Test Task',
        description: 'Test Description',
        dueDate: new Date('2025-12-31'),
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        creatorId: 'user123',
        assignedToId: 'user456',
      };

      const input = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: '2025-12-31T00:00:00.000Z',
        priority: TaskPriority.HIGH,
        assignedToId: 'user456',
      };

      mockCreate.mockResolvedValue(mockTask);
      mockFindById.mockResolvedValue(mockTask);

      await taskService.createTask(input, 'user123');

      expect(mockEmitTaskAssigneeChange).toHaveBeenCalledWith(
        '123',
        undefined,
        'user456',
        mockTask
      );
    });
  });

  describe('deleteTask', () => {
    it('should allow creator to delete their task', async () => {
      const mockTask = {
        _id: '123',
        creatorId: { toString: () => 'user123' },
      };

      mockFindById.mockResolvedValue(mockTask);
      mockDelete.mockResolvedValue(true);

      await taskService.deleteTask('123', 'user123');

      expect(mockDelete).toHaveBeenCalledWith('123');
    });

    it('should throw ForbiddenError when non-creator tries to delete', async () => {
      const mockTask = {
        _id: '123',
        creatorId: { toString: () => 'user123' },
      };

      mockFindById.mockResolvedValue(mockTask);

      await expect(taskService.deleteTask('123', 'user456')).rejects.toThrow(
        'Only the creator can delete this task'
      );
    });

    it('should throw NotFoundError when task does not exist', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(taskService.deleteTask('999', 'user123')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('updateTask', () => {
    it('should emit status change event when status is updated', async () => {
      const mockTask = {
        _id: '123',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assignedToId: undefined,
      };

      const updatedTask = {
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      };

      mockFindById.mockResolvedValue(mockTask);
      mockUpdate.mockResolvedValue(updatedTask);

      await taskService.updateTask(
        '123',
        { status: TaskStatus.IN_PROGRESS },
        'user123'
      );

      expect(mockEmitTaskStatusChange).toHaveBeenCalledWith(
        '123',
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        updatedTask
      );
    });

    it('should emit priority change event when priority is updated', async () => {
      const mockTask = {
        _id: '123',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assignedToId: undefined,
      };

      const updatedTask = {
        ...mockTask,
        priority: TaskPriority.URGENT,
      };

      mockFindById.mockResolvedValue(mockTask);
      mockUpdate.mockResolvedValue(updatedTask);

      await taskService.updateTask(
        '123',
        { priority: TaskPriority.URGENT },
        'user123'
      );

      expect(mockEmitTaskPriorityChange).toHaveBeenCalledWith(
        '123',
        TaskPriority.MEDIUM,
        TaskPriority.URGENT,
        updatedTask
      );
    });
  });
});
