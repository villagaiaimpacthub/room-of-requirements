// Task Progress Dashboard Component
// Shows comprehensive project progress, task completion, and recommendations

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  BarChart3, 
  Target,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import taskService from '../services/taskService';
import {
  Task,
  TaskProgress,
  ProjectProgress,
  NextTaskRecommendation,
  TaskStatus,
  TaskPriority
} from '../types/task';

interface TaskProgressDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const TaskProgressDashboard: React.FC<TaskProgressDashboardProps> = ({ isOpen, onClose }) => {
  const [projectProgress, setProjectProgress] = useState<ProjectProgress | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [taskProgresses, setTaskProgresses] = useState<Map<string, TaskProgress>>(new Map());
  const [nextRecommendation, setNextRecommendation] = useState<NextTaskRecommendation | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedSprint, setSelectedSprint] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      loadDashboardData();
    }
  }, [isOpen]);

  const loadDashboardData = () => {
    // Load project progress
    const progress = taskService.getProjectProgress();
    setProjectProgress(progress);

    // Load all tasks
    const tasks = taskService.getAllTasks();
    setAllTasks(tasks);

    // Load task progresses
    const progresses = new Map<string, TaskProgress>();
    tasks.forEach(task => {
      try {
        const taskProgress = taskService.getTaskProgress(task.id);
        progresses.set(task.id, taskProgress);
      } catch (error) {
        console.error(`Error loading progress for task ${task.id}:`, error);
      }
    });
    setTaskProgresses(progresses);

    // Load next recommendation
    const recommendation = taskService.getNextTaskRecommendation();
    setNextRecommendation(recommendation);
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'P0': return 'text-red-600 bg-red-100';
      case 'P1': return 'text-orange-600 bg-orange-100';
      case 'P2': return 'text-yellow-600 bg-yellow-100';
      case 'P3': return 'text-blue-600 bg-blue-100';
      case 'P4': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Play className="w-4 h-4 text-gray-400" />;
    }
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'very-high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleTaskStatusUpdate = (taskId: string, status: TaskStatus) => {
    taskService.updateTaskStatus(taskId, status);
    loadDashboardData(); // Refresh data
  };

  const handleAcceptanceCriteriaToggle = (taskId: string, criteriaId: string, completed: boolean) => {
    taskService.updateAcceptanceCriteria(taskId, criteriaId, completed);
    loadDashboardData(); // Refresh data
  };

  const handleTechnicalImplementationToggle = (taskId: string, implementationId: string, completed: boolean) => {
    taskService.updateTechnicalImplementation(taskId, implementationId, completed);
    loadDashboardData(); // Refresh data
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">TaskMaster Progress Dashboard</h2>
                <p className="text-blue-100">Room of Requirements Project Status</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Overall Progress */}
          {projectProgress && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-medium">Overall Progress</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{projectProgress.overallCompletionPercentage}%</div>
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-1">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${projectProgress.overallCompletionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Tasks Completed</span>
                </div>
                <div className="text-2xl font-bold mt-2">
                  {projectProgress.completedTasks}/{projectProgress.totalTasks}
                </div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Remaining Hours</span>
                </div>
                <div className="text-2xl font-bold mt-2">{projectProgress.estimatedRemainingHours}h</div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Current Sprint</span>
                </div>
                <div className="text-2xl font-bold mt-2">Sprint {projectProgress.currentSprint}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Next Task Recommendation */}
            {nextRecommendation && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-2">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      🎯 Next Recommended Task
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{nextRecommendation.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(nextRecommendation.priority)}`}>
                            {nextRecommendation.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            nextRecommendation.impact === 'critical' ? 'text-red-600 bg-red-100' :
                            nextRecommendation.impact === 'high' ? 'text-orange-600 bg-orange-100' :
                            nextRecommendation.impact === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                            'text-gray-600 bg-gray-100'
                          }`}>
                            {nextRecommendation.impact} impact
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{nextRecommendation.reason}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>⏱️ {nextRecommendation.estimatedHours}h estimated</span>
                        <span>🔧 Complexity: {nextRecommendation.complexity}/10</span>
                        {nextRecommendation.dependencies.length > 0 && (
                          <span>📋 {nextRecommendation.dependencies.length} dependencies</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleTaskStatusUpdate(nextRecommendation.taskId, 'in-progress')}
                        className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Start This Task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sprint Progress */}
            {projectProgress && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprint Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projectProgress.sprintProgress.map((sprint) => (
                    <div 
                      key={sprint.sprintNumber}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedSprint === sprint.sprintNumber 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSprint(sprint.sprintNumber)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Sprint {sprint.sprintNumber}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(sprint.riskLevel)}`}>
                          {sprint.riskLevel} risk
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{sprint.name}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{sprint.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`rounded-full h-2 transition-all duration-300 ${getProgressBarColor(sprint.completionPercentage)}`}
                            style={{ width: `${sprint.completionPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{sprint.completedTasks}/{sprint.totalTasks} tasks</span>
                          <span>{sprint.estimatedHours}h estimated</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Task List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tasks & Subtasks</h3>
              <div className="space-y-3">
                {allTasks.map((task) => {
                  const progress = taskProgresses.get(task.id);
                  const isExpanded = expandedTasks.has(task.id);
                  
                  return (
                    <div key={task.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Task Header */}
                      <div 
                        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {getStatusIcon(task.status)}
                            <div>
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-sm text-gray-500">{task.estimatedHours}h</span>
                            {progress && (
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`rounded-full h-2 transition-all duration-300 ${getProgressBarColor(progress.completionPercentage)}`}
                                    style={{ width: `${progress.completionPercentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{progress.completionPercentage}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Task Details */}
                      {isExpanded && progress && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Acceptance Criteria */}
                            <div>
                              <h5 className="font-medium text-gray-900 mb-3">
                                Acceptance Criteria ({progress.acceptanceCriteriaCompleted}/{progress.acceptanceCriteriaTotal})
                              </h5>
                              <div className="space-y-2">
                                {task.acceptanceCriteria.map((criteria) => (
                                  <label key={criteria.id} className="flex items-start space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={criteria.completed}
                                      onChange={(e) => handleAcceptanceCriteriaToggle(task.id, criteria.id, e.target.checked)}
                                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ${criteria.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                      {criteria.description}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Technical Implementation */}
                            <div>
                              <h5 className="font-medium text-gray-900 mb-3">
                                Technical Implementation ({progress.technicalImplementationCompleted}/{progress.technicalImplementationTotal})
                              </h5>
                              <div className="space-y-2">
                                {task.technicalImplementation.map((implementation) => (
                                  <label key={implementation.id} className="flex items-start space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={implementation.completed}
                                      onChange={(e) => handleTechnicalImplementationToggle(task.id, implementation.id, e.target.checked)}
                                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className={`text-sm ${implementation.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                      {implementation.description}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Task Actions */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Complexity: {task.complexity}/10</span>
                                <span>Category: {task.category}</span>
                                {progress.isBlocked && (
                                  <span className="text-red-600 font-medium">
                                    🚫 Blocked by: {progress.blockedBy.join(', ')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <select
                                  value={task.status}
                                  onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value as TaskStatus)}
                                  className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="not-started">Not Started</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="completed">Completed</option>
                                  <option value="blocked">Blocked</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskProgressDashboard; 