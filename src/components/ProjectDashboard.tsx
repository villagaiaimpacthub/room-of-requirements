import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  BarChart3, 
  Calendar,
  Users,
  Zap,
  TrendingUp,
  GitBranch,
  Target,
  Activity
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  phase: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  estimatedEffort: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  dependencies: string[];
  subtasks?: Task[];
}

interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  averageComplexity: number;
  estimatedDuration: string;
  currentPhase: number;
  totalPhases: number;
}

const ProjectDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalTasks: 24,
    completedTasks: 0,
    inProgressTasks: 0,
    blockedTasks: 0,
    averageComplexity: 6.7,
    estimatedDuration: '24 weeks',
    currentPhase: 1,
    totalPhases: 6
  });
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'overview' | 'tasks' | 'timeline' | 'dependencies'>('overview');

  // Mock data - in real implementation, this would come from your task management system
  useEffect(() => {
    // Load tasks from JSON file or API
    const mockTasks: Task[] = [
      {
        id: 'T001',
        title: 'Project Setup & Infrastructure',
        description: 'Initialize project structure, dependencies, and basic configuration',
        phase: 1,
        priority: 'critical',
        complexity: 4,
        estimatedEffort: '2 weeks',
        status: 'pending',
        dependencies: []
      },
      {
        id: 'T002',
        title: 'Basic Authentication System',
        description: 'Implement JWT-based authentication with OAuth integration',
        phase: 1,
        priority: 'high',
        complexity: 5,
        estimatedEffort: '1 week',
        status: 'pending',
        dependencies: ['T001']
      },
      // Add more tasks as needed
    ];
    setTasks(mockTasks);
  }, []);

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplexityIndicator = (complexity: number): JSX.Element => {
    const color = complexity >= 8 ? 'text-red-500' : complexity >= 6 ? 'text-yellow-500' : 'text-green-500';
    return (
      <div className={`flex items-center ${color}`}>
        <div className="flex space-x-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < complexity ? 'bg-current' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="ml-2 text-sm font-medium">{complexity}/10</span>
      </div>
    );
  };

  const calculateProgress = (): number => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const getPhaseProgress = (phase: number): number => {
    const phaseTasks = tasks.filter(task => task.phase === phase);
    if (phaseTasks.length === 0) return 0;
    const completed = phaseTasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / phaseTasks.length) * 100);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Project Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Progress</p>
              <p className="text-2xl font-bold text-gray-900">{calculateProgress()}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Phase</p>
              <p className="text-2xl font-bold text-gray-900">{stats.currentPhase}/{stats.totalPhases}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Foundation Phase</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Complexity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageComplexity}/10</p>
            </div>
            <BarChart3 className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">High complexity project</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Timeline</p>
              <p className="text-2xl font-bold text-gray-900">{stats.estimatedDuration}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Estimated completion</p>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Progress</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map(phase => {
            const progress = getPhaseProgress(phase);
            const phaseNames = [
              'Foundation', 'AI Development', 'Marketplace', 
              'Advanced Features', 'AI Analysis', 'Launch'
            ];
            return (
              <div key={phase} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-20">
                  <span className="text-sm font-medium text-gray-700">
                    Phase {phase}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{phaseNames[phase - 1]}</span>
                    <span className="text-gray-900 font-medium">{progress}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* High Priority Tasks */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">High Priority Tasks</h3>
        <div className="space-y-3">
          {tasks
            .filter(task => task.priority === 'critical' || task.priority === 'high')
            .slice(0, 5)
            .map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="font-medium text-gray-900">{task.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  {getComplexityIndicator(task.complexity)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderTasksTab = () => (
    <div className="space-y-6">
      {/* Phase Filter */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setSelectedPhase(0)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedPhase === 0 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Phases
        </button>
        {[1, 2, 3, 4, 5, 6].map(phase => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPhase === phase 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Phase {phase}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tasks {selectedPhase > 0 ? `- Phase ${selectedPhase}` : ''}
          </h3>
          <div className="space-y-4">
            {tasks
              .filter(task => selectedPhase === 0 || task.phase === selectedPhase)
              .map(task => (
                <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">{task.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Phase {task.phase}</span>
                        <span>•</span>
                        <span>{task.estimatedEffort}</span>
                        <span>•</span>
                        <span>Dependencies: {task.dependencies.length}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {getComplexityIndicator(task.complexity)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimelineTab = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Timeline</h3>
      <div className="relative">
        {[1, 2, 3, 4, 5, 6].map((phase, index) => {
          const phaseNames = [
            'Foundation (Weeks 1-4)',
            'AI Development (Weeks 5-8)', 
            'Marketplace (Weeks 9-12)',
            'Advanced Features (Weeks 13-16)',
            'AI Analysis (Weeks 17-20)',
            'Launch Preparation (Weeks 21-24)'
          ];
          const isActive = phase === stats.currentPhase;
          const isCompleted = phase < stats.currentPhase;
          
          return (
            <div key={phase} className="flex items-center mb-8">
              <div className="flex-shrink-0 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-600 text-white' :
                  isActive ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : phase}
                </div>
                {index < 5 && (
                  <div className={`w-px h-12 ml-4 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              <div className="ml-6 flex-1">
                <h4 className={`font-semibold ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                  Phase {phase}: {phaseNames[index]}
                </h4>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-green-600' : isActive ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    style={{ width: `${getPhaseProgress(phase)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getPhaseProgress(phase)}% complete
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDependenciesTab = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Task Dependencies</h3>
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{task.title}</h4>
              <span className="text-sm text-gray-500">{task.id}</span>
            </div>
            {task.dependencies.length > 0 ? (
              <div className="flex items-center space-x-2 text-sm">
                <GitBranch className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Depends on:</span>
                <div className="flex space-x-2">
                  {task.dependencies.map(dep => (
                    <span key={dep} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <GitBranch className="w-4 h-4" />
                <span>No dependencies</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Room of Requirements</h1>
          <p className="text-gray-600">AI-powered platform for project development and marketplace</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: 'overview', label: 'Overview', icon: Activity },
            { key: 'tasks', label: 'Tasks', icon: CheckCircle },
            { key: 'timeline', label: 'Timeline', icon: Calendar },
            { key: 'dependencies', label: 'Dependencies', icon: GitBranch }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {viewMode === 'overview' && renderOverviewTab()}
        {viewMode === 'tasks' && renderTasksTab()}
        {viewMode === 'timeline' && renderTimelineTab()}
        {viewMode === 'dependencies' && renderDependenciesTab()}
      </div>
    </div>
  );
};

export default ProjectDashboard; 