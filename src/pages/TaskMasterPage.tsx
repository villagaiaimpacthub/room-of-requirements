import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  Clock, 
  Target, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Play, 
  Pause,
  Download,
  FileText,
  ListTodo,
  Zap,
  ArrowRight,
  Loader2,
  Eye,
  Settings,
  TrendingUp
} from 'lucide-react';
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

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  action?: () => void;
  mcpTool?: string;
}

const TaskMasterPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskMasterTask[]>([]);
  const [stats, setStats] = useState<TaskMasterStats | null>(null);
  const [nextTask, setNextTask] = useState<TaskMasterTask | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<string>('tasks-generated');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Workflow steps definition
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'prd-created',
      title: 'PRD Generated',
      description: 'Product Requirements Document has been created from your conversation',
      status: 'completed'
    },
    {
      id: 'tasks-generated',
      title: 'Tasks Generated',
      description: '15 development tasks have been created from your PRD',
      status: 'completed'
    },
    {
      id: 'analyze-complexity',
      title: 'Analyze Task Complexity',
      description: 'Use AI to analyze which tasks need to be broken down further',
      status: 'current',
      mcpTool: 'analyze_project_complexity'
    },
    {
      id: 'expand-tasks',
      title: 'Expand Complex Tasks',
      description: 'Break down complex tasks into manageable subtasks',
      status: 'pending',
      mcpTool: 'expand_all'
    },
    {
      id: 'start-development',
      title: 'Begin Development',
      description: 'Start working on the first available task',
      status: 'pending',
      mcpTool: 'next_task'
    }
  ];

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Set initial stats based on known task count
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

      } catch (err) {
        console.error('Error initializing TaskMaster data:', err);
        setError('Failed to load TaskMaster AI data.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Download PRD function
  const downloadPRD = async () => {
    try {
      setActionLoading('download-prd');
      
      // Read the PRD file and trigger download
      const response = await fetch('/scripts/room-of-requirements-prd.md');
      if (!response.ok) {
        throw new Error('Failed to fetch PRD file');
      }
      
      const prdContent = await response.text();
      const blob = new Blob([prdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'room-of-requirements-prd.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading PRD:', err);
      setError('Failed to download PRD file.');
    } finally {
      setActionLoading(null);
    }
  };

  // View tasks function
  const viewTasks = async () => {
    try {
      setActionLoading('view-tasks');
      
      // In a real implementation, this would call the MCP tool:
      // const tasks = await mcp_taskmaster_ai_get_tasks({ projectRoot: "C:\\room-of-requirements" });
      
      const message = `To view all tasks with full details, use this TaskMaster AI MCP tool:

🔧 Tool: get_tasks
📁 Project Root: C:\\room-of-requirements
📋 With Subtasks: true (to see breakdown)

This will show:
• All 15 generated tasks
• Task descriptions and details
• Dependencies between tasks
• Current status of each task
• Priority levels and complexity
• Implementation strategies

You can also filter by status (pending, done, in-progress) or view specific tasks with get_task tool.`;
      
      alert(message);
      
    } catch (err) {
      console.error('Error viewing tasks:', err);
      setError('Failed to view tasks.');
    } finally {
      setActionLoading(null);
    }
  };

  // Analyze complexity function
  const analyzeComplexity = async () => {
    try {
      setActionLoading('analyze-complexity');
      
      // In a real implementation, this would call the MCP tool:
      // await mcp_taskmaster_ai_analyze_project_complexity({ 
      //   projectRoot: "C:\\room-of-requirements",
      //   research: true,
      //   threshold: 5
      // });
      
      const message = `To analyze task complexity, use this TaskMaster AI MCP tool in Cursor:

🔧 Tool: analyze_project_complexity
📁 Project Root: C:\\room-of-requirements
🔬 Research: true (for better analysis)
📊 Threshold: 5 (complexity score 1-10)

This will:
• Analyze all 15 tasks for complexity
• Identify which tasks need breakdown
• Generate a complexity report
• Recommend expansion strategies

After running this, you'll have a detailed report showing which tasks are too complex and need to be broken down into subtasks.`;
      
      alert(message);
      setCurrentWorkflowStep('expand-tasks');
      
    } catch (err) {
      console.error('Error analyzing complexity:', err);
      setError('Failed to analyze task complexity.');
    } finally {
      setActionLoading(null);
    }
  };

  // Expand all tasks function
  const expandAllTasks = async () => {
    try {
      setActionLoading('expand-tasks');
      
      // In a real implementation, this would call the MCP tool:
      // await mcp_taskmaster_ai_expand_all({ 
      //   projectRoot: "C:\\room-of-requirements",
      //   research: true,
      //   force: false
      // });
      
      const message = `To expand complex tasks into subtasks, use this TaskMaster AI MCP tool:

🔧 Tool: expand_all
📁 Project Root: C:\\room-of-requirements
🔬 Research: true (for detailed subtasks)
⚡ Force: false (append to existing subtasks)

This will:
• Break down all complex tasks (score 5+)
• Create detailed subtasks for each
• Maintain dependency relationships
• Generate implementation details

Run this after complexity analysis to get manageable development tasks.`;
      
      alert(message);
      setCurrentWorkflowStep('start-development');
      
    } catch (err) {
      console.error('Error expanding tasks:', err);
      setError('Failed to expand tasks.');
    } finally {
      setActionLoading(null);
    }
  };

  // Get next task function
  const getNextTask = async () => {
    try {
      setActionLoading('next-task');
      
      // In a real implementation, this would call the MCP tool:
      // const nextTask = await mcp_taskmaster_ai_next_task({ projectRoot: "C:\\room-of-requirements" });
      
      const message = `To get the next recommended task to work on:

🔧 Tool: next_task
📁 Project Root: C:\\room-of-requirements

This will:
• Analyze all task dependencies
• Find tasks with completed prerequisites
• Recommend based on priority and complexity
• Show detailed implementation guidance

Perfect for starting development work!`;
      
      alert(message);
      
    } catch (err) {
      console.error('Error getting next task:', err);
      setError('Failed to get next task.');
    } finally {
      setActionLoading(null);
    }
  };

  // Get workflow step action
  const getWorkflowStepAction = (stepId: string) => {
    switch (stepId) {
      case 'analyze-complexity':
        return analyzeComplexity;
      case 'expand-tasks':
        return expandAllTasks;
      case 'start-development':
        return getNextTask;
      default:
        return undefined;
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
        {/* Project Overview Stats */}
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
                <TrendingUp className="w-8 h-8 text-purple-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-slate-400">Progress</p>
                  <p className="text-2xl font-bold text-white">{stats.completionPercentage}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Progress */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Development Workflow</h2>
          
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const isActive = step.status === 'current';
              const isCompleted = step.status === 'completed';
              const isPending = step.status === 'pending';
              const action = getWorkflowStepAction(step.id);
              const isLoading = actionLoading === step.id;

              return (
                <div
                  key={step.id}
                  className={`flex items-center p-4 rounded-lg border transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-900/30 border-blue-600/50'
                      : isCompleted
                      ? 'bg-green-900/20 border-green-600/30'
                      : 'bg-slate-700/30 border-slate-600/30'
                  }`}
                >
                  {/* Step Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-300'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isActive ? (
                      <Play className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      isActive ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-slate-300'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{step.description}</p>
                    {step.mcpTool && (
                      <p className="text-xs text-slate-500 mt-1">
                        MCP Tool: <code className="text-blue-400">{step.mcpTool}</code>
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  {action && isActive && (
                    <button
                      onClick={action}
                      disabled={isLoading}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      {isLoading ? 'Processing...' : 'Execute'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Download PRD */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-white">Download PRD</h3>
                <p className="text-sm text-slate-400">Get your Product Requirements Document</p>
              </div>
            </div>
            <button
              onClick={downloadPRD}
              disabled={actionLoading === 'download-prd'}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {actionLoading === 'download-prd' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {actionLoading === 'download-prd' ? 'Downloading...' : 'Download PRD'}
            </button>
          </div>

          {/* View Tasks */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center mb-4">
              <ListTodo className="w-8 h-8 text-blue-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-white">View All Tasks</h3>
                <p className="text-sm text-slate-400">See the 15 generated development tasks</p>
              </div>
            </div>
            <button
              onClick={viewTasks}
              disabled={actionLoading === 'view-tasks'}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {actionLoading === 'view-tasks' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {actionLoading === 'view-tasks' ? 'Loading...' : 'View Tasks'}
            </button>
          </div>

          {/* MCP Tools Reference */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center mb-4">
              <Settings className="w-8 h-8 text-purple-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-white">MCP Tools</h3>
                <p className="text-sm text-slate-400">Available TaskMaster AI commands</p>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="border-b border-slate-600 pb-2">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Core Tools</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <code className="text-blue-300">get_tasks</code>
                    <span className="text-slate-400">List all tasks</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-300">next_task</code>
                    <span className="text-slate-400">Get next task</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-300">get_task</code>
                    <span className="text-slate-400">View specific task</span>
                  </div>
                </div>
              </div>
              <div className="border-b border-slate-600 pb-2">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Task Management</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <code className="text-blue-300">set_task_status</code>
                    <span className="text-slate-400">Update status</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-300">add_task</code>
                    <span className="text-slate-400">Create new task</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-300">update_task</code>
                    <span className="text-slate-400">Modify task</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Advanced</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <code className="text-blue-300">expand_task</code>
                    <span className="text-slate-400">Break down task</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-300">expand_all</code>
                    <span className="text-slate-400">Expand all tasks</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-blue-300">analyze_project_complexity</code>
                    <span className="text-slate-400">Complexity analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-amber-900/20 border border-amber-600/30 rounded-lg p-6">
          <div className="flex items-start">
            <Zap className="w-6 h-6 text-amber-400 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-amber-200 mb-2">Next Steps</h3>
              <div className="text-amber-100 space-y-2 text-sm">
                <p>1. <strong>Analyze Complexity:</strong> Use the workflow above to analyze which tasks need breakdown</p>
                <p>2. <strong>Expand Tasks:</strong> Break complex tasks into manageable subtasks</p>
                <p>3. <strong>Start Development:</strong> Begin working on the first available task</p>
                <p>4. <strong>Use MCP Tools:</strong> All TaskMaster AI functionality is available through Cursor's MCP integration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskMasterPage; 