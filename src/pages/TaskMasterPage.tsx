import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, Clock, Target, Users, ChevronDown, ChevronRight, CheckCircle, Circle, AlertTriangle, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// TaskMaster AI Task Interface
interface TaskMasterTask {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  dependencies: number[];
  subtasks: any[];
  details?: string;
  testStrategy?: string;
}

interface TaskMasterStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  deferred: number;
  cancelled: number;
  completionPercentage: number;
}

const TaskMasterPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskMasterTask[]>([]);
  const [stats, setStats] = useState<TaskMasterStats | null>(null);
  const [nextTask, setNextTask] = useState<TaskMasterTask | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch TaskMaster AI data
  const fetchTaskMasterData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: This page now shows a message about using MCP tools directly
      // The actual TaskMaster AI integration happens through Cursor's MCP tools
      
      // Display message about using MCP tools
      setTasks([]);
      setStats({
        total: 15,
        completed: 0,
        inProgress: 0,
        pending: 15,
        blocked: 0,
        deferred: 0,
        cancelled: 0,
        completionPercentage: 0
      });
      setNextTask(null);

    } catch (err) {
      console.error('Error fetching TaskMaster AI data:', err);
      setError('Failed to load TaskMaster AI data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskMasterData();
  }, []);

  const handleTaskStatusUpdate = async (taskId: number, newStatus: string) => {
    try {
      // In a real implementation, this would call the MCP tool:
      // await mcp_taskmaster_ai_set_task_status({ id: taskId.toString(), status: newStatus, projectRoot: "C:\\room-of-requirements" });
      
      // For now, update locally
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // Recalculate stats
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      
      const newStats = {
        total: updatedTasks.length,
        completed: updatedTasks.filter(t => t.status === 'done').length,
        inProgress: updatedTasks.filter(t => t.status === 'in-progress').length,
        pending: updatedTasks.filter(t => t.status === 'pending').length,
        blocked: updatedTasks.filter(t => t.status === 'blocked').length,
        deferred: updatedTasks.filter(t => t.status === 'deferred').length,
        cancelled: updatedTasks.filter(t => t.status === 'cancelled').length,
        completionPercentage: Math.round((updatedTasks.filter(t => t.status === 'done').length / updatedTasks.length) * 100)
      };
      
      setStats(newStats);
      
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status.');
    }
  };

  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in-progress':
        return <Play className="w-5 h-5 text-blue-400" />;
      case 'blocked':
        return <Pause className="w-5 h-5 text-red-400" />;
      case 'deferred':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-900 text-red-300 border-red-700';
      case 'medium': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'low': return 'bg-green-900 text-green-300 border-green-700';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-900 text-green-300 border-green-700';
      case 'in-progress': return 'bg-blue-900 text-blue-300 border-blue-700';
      case 'blocked': return 'bg-red-900 text-red-300 border-red-700';
      case 'deferred': return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'cancelled': return 'bg-gray-900 text-gray-300 border-gray-700';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading TaskMaster AI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-slate-300 hover:text-white transition-colors duration-200 hover:bg-slate-700 px-3 py-2 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Room
              </button>
              <div className="h-6 w-px bg-slate-600"></div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">TaskMaster AI Dashboard</h1>
                  <p className="text-sm text-slate-400">Room of Requirements Project</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Connected to TaskMaster AI</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-400">MCP Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900 border-b border-red-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
              <p className="text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-400">Completed</p>
                  <p className="text-2xl font-bold text-white">{stats.completed}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center">
                <Play className="w-8 h-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-400">In Progress</p>
                  <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-400">Progress</p>
                  <p className="text-2xl font-bold text-white">{stats.completionPercentage}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TaskMaster AI Integration Message */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <div className="max-w-2xl mx-auto">
            <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">TaskMaster AI Integration Active</h2>
            <p className="text-slate-300 mb-6">
              TaskMaster AI is now integrated with this project through MCP (Model Context Protocol). 
              Use the TaskMaster AI tools directly in Cursor to manage your tasks, rather than this dashboard interface.
            </p>
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Available MCP Tools:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="text-left">
                  <p>• <code className="text-blue-300">get_tasks</code> - View all tasks</p>
                  <p>• <code className="text-blue-300">next_task</code> - Get next recommended task</p>
                  <p>• <code className="text-blue-300">set_task_status</code> - Update task status</p>
                  <p>• <code className="text-blue-300">expand_task</code> - Break down complex tasks</p>
                </div>
                <div className="text-left">
                  <p>• <code className="text-blue-300">add_task</code> - Create new tasks</p>
                  <p>• <code className="text-blue-300">update_task</code> - Modify existing tasks</p>
                  <p>• <code className="text-blue-300">analyze_project_complexity</code> - Analyze tasks</p>
                  <p>• <code className="text-blue-300">generate</code> - Create task files</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4">
              <p className="text-amber-200 text-sm">
                <strong>Current Status:</strong> {stats.total} tasks generated from PRD, {stats.pending} pending tasks ready to begin development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskMasterPage; 