import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi, taskApi } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { SkeletonList } from '../components/SkeletonLoader';
import TaskForm from '../components/TaskForm';
import { useState, useMemo, useEffect } from 'react';
import { socket } from '../lib/socket';

type TabType = 'all' | 'assigned' | 'created' | 'overdue';
type StatusFilter = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE';
type PriorityFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';

export default function Dashboard() {
  const navigate = useNavigate();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [sortByDueDate, setSortByDueDate] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.getTasks().then((res) => res.data),
  });

  // Socket.io real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      socket.auth = { token };
      socket.connect();

      socket.on('taskUpdated', (updatedTask) => {
        queryClient.setQueryData(['tasks'], (old: any) => {
          if (!old) return [updatedTask];
          return old.map((t: any) => (t._id === updatedTask._id ? updatedTask : t));
        });
      });

      socket.on('taskAssigned', (data) => {
        setNotification(`You've been assigned to: ${data.task.title}`);
        setTimeout(() => setNotification(null), 5000);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      });

      return () => {
        socket.off('taskUpdated');
        socket.off('taskAssigned');
        socket.disconnect();
      };
    }
  }, []);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      navigate('/login');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taskApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(taskId);
    }
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];

    let filtered = tasks.filter((task: any) => {
      // Tab filtering
      const now = new Date();
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = dueDate && dueDate < now && task.status !== 'DONE';

      if (activeTab === 'assigned' && !task.assignedTo) return false;
      if (activeTab === 'created' && !task.createdBy) return false;
      if (activeTab === 'overdue' && !isOverdue) return false;

      // Status filtering
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;

      // Priority filtering
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

      return true;
    });

    // Sorting by due date
    if (sortByDueDate) {
      filtered = [...filtered].sort((a: any, b: any) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return filtered;
  }, [tasks, activeTab, statusFilter, priorityFilter, sortByDueDate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notification}
        </div>
      )}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
            <button
              onClick={() => setShowTaskForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              + New Task
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All Tasks' },
                { id: 'assigned', label: 'Assigned to Me' },
                { id: 'created', label: 'Created by Me' },
                { id: 'overdue', label: 'Overdue' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Filters and Sorting */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              >
                <option value="ALL">All</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              >
                <option value="ALL">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sortByDueDate}
                  onChange={(e) => setSortByDueDate(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Sort by Due Date</span>
              </label>
            </div>
          </div>

          {isLoading ? (
            <SkeletonList count={5} />
          ) : filteredAndSortedTasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedTasks.map((task: any) => {
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== 'DONE';
                return (
                  <div
                    key={task._id}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow ${
                      isOverdue ? 'border-2 border-red-500' : ''
                    }`}
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {task.description || 'No description'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.priority === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : task.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'DONE'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {task.status}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className="mt-4 text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {task.assignedTo && (
                        <div className="mt-2 text-xs text-gray-500">
                          Assigned to: {task.assignedTo.name || task.assignedTo.email}
                        </div>
                      )}
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-sm text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks found. Create one to get started!</p>
            </div>
          )}
        </div>
      </main>

      {showTaskForm && (
        <TaskForm task={editingTask} onClose={handleCloseForm} />
      )}
    </div>
  );
}
