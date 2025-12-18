import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

export let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
    });
  });

  return io;
};

export const emitTaskUpdate = (taskId: string, eventType: string, data: any) => {
  if (!io) return;
  io.emit(`task:${eventType}`, { taskId, ...data });
};

export const emitTaskAssignment = (userId: string, task: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('task:assigned', {
    message: `You have been assigned to task: ${task.title}`,
    task,
  });
};

export const emitTaskStatusChange = (taskId: string, oldStatus: string, newStatus: string, task: any) => {
  if (!io) return;
  io.emit('task:status-changed', {
    taskId,
    oldStatus,
    newStatus,
    task,
  });
};

export const emitTaskPriorityChange = (taskId: string, oldPriority: string, newPriority: string, task: any) => {
  if (!io) return;
  io.emit('task:priority-changed', {
    taskId,
    oldPriority,
    newPriority,
    task,
  });
};

export const emitTaskAssigneeChange = (taskId: string, oldAssigneeId: string | undefined, newAssigneeId: string | undefined, task: any) => {
  if (!io) return;
  
  if (newAssigneeId && newAssigneeId !== oldAssigneeId) {
    emitTaskAssignment(newAssigneeId, task);
  }
  
  io.emit('task:assignee-changed', {
    taskId,
    oldAssigneeId,
    newAssigneeId,
    task,
  });
};
