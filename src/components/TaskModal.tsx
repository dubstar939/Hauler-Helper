import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  Check, 
  X, 
  AlertCircle,
  MoreVertical,
  Filter,
  ChevronRight,
  Layout,
  Tag
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useDatabase } from '../context/DatabaseContext';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { Modal } from './Modal';
import { cn } from '../lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useGlobal();
  const { tasks, setTasks } = useDatabase();
  
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const handleAdd = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: 'New Task',
      description: 'Task description...',
      dueDate: new Date().toISOString().split('T')[0],
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      haulerId: '',
      haulerName: 'General Task',
      createdAt: new Date().toISOString()
    };
    setTasks([newTask, ...tasks]);
    setEditingId(newTask.id);
    setEditForm(newTask);
    showToast('New task added');
  };

  const handleSave = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...editForm } as Task : t));
    setEditingId(null);
    showToast('Task updated');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
      showToast('Task deleted');
    }
  };

  const toggleStatus = (task: Task) => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    showToast(`Task marked as ${newStatus.toLowerCase()}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Manager"
      icon={<CheckSquare size={20} />}
      className="max-w-6xl"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {tasks.filter(t => t.status === TaskStatus.PENDING).length} Pending Tasks
          </p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus size={18} />
            Add New Task
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-8 h-[600px]">
        {/* Task Filter & List */}
        <div className="w-full lg:w-80 space-y-6 flex flex-col">
          <div className="flex items-center gap-2">
            {(['all', TaskStatus.PENDING, TaskStatus.COMPLETED] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  filterStatus === s 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {filteredTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setEditingId(t.id);
                  setEditForm(t);
                }}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all group relative",
                  editingId === t.id 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-500/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStatus(t); }}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        t.status === TaskStatus.COMPLETED 
                          ? "bg-green-500 border-green-500 text-white" 
                          : "border-gray-300 dark:border-gray-600 hover:border-indigo-500"
                      )}
                    >
                      {t.status === TaskStatus.COMPLETED && <Check size={12} />}
                    </button>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      t.priority === TaskPriority.HIGH ? "text-red-500" :
                      t.priority === TaskPriority.MEDIUM ? "text-amber-500" : "text-green-500"
                    )}>
                      {t.priority}
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-1 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className={cn(
                  "text-sm font-black text-gray-900 dark:text-white truncate",
                  t.status === TaskStatus.COMPLETED && "line-through opacity-50"
                )}>{t.title}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Calendar size={10} />
                    {t.dueDate}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <User size={10} />
                    {t.haulerName}
                  </span>
                </div>
              </button>
            ))}
            {filteredTasks.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-xs font-bold text-gray-400">No tasks found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {editingId ? (
            <div className="flex-1 flex flex-col space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Task Title</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Due Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="date"
                      value={editForm.dueDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Priority</label>
                  <div className="relative">
                    <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select
                      value={editForm.priority || TaskPriority.MEDIUM}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskPriority })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white appearance-none"
                    >
                      <option value={TaskPriority.LOW}>Low Priority</option>
                      <option value={TaskPriority.MEDIUM}>Medium Priority</option>
                      <option value={TaskPriority.HIGH}>High Priority</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
                  placeholder="Add more details about this task..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Associated Hauler</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={editForm.haulerName || ''}
                    readOnly
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editingId)}
                  className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20"
                >
                  <Check size={18} />
                  Save Task
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300">
                <CheckSquare size={40} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Select a Task</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                  Choose a task from the list to view details or create a new one to get started.
                </p>
              </div>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
              >
                <Plus size={18} />
                Create New Task
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
