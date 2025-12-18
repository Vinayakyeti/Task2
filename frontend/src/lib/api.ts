import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true,
});

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  creatorId: {
    _id: string;
    name: string;
    email: string;
  };
  assignedToId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  register: (data: RegisterData) => api.post<User>('/auth/register', data),
  login: (data: LoginData) => api.post<User>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

export const taskApi = {
  getTasks: (params?: Record<string, string>) => api.get<Task[]>('/tasks', { params }),
  getTask: (id: string) => api.get<Task>(`/tasks/${id}`),
  createTask: (data: any) => api.post<Task>('/tasks', data),
  updateTask: (id: string, data: any) => api.put<Task>(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
};

export default api;
