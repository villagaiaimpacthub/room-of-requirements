// Task Service for Room of Requirements
// Fetches real-time data from TaskMaster MCP server

import {
  Task,
  TaskProgress,
  ProjectProgress,
  NextTaskRecommendation,
  TaskStatus,
  TaskPriority,
  SprintProgress,
  TaskService as ITaskService
} from '../types/task';

class TaskService implements ITaskService {
  private baseUrl = 'http://localhost:3001/api/v1/taskmaster';

  // Fetch all tasks from TaskMaster API
  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      console.error('Error fetching tasks from TaskMaster API:', error);
      // Return fallback data if TaskMaster API is unavailable
      return this.getFallbackTasks();
    }
  }

  // Get task by ID
  async getTaskById(id: string): Promise<Task | undefined> {
    const tasks = await this.getAllTasks();
    return tasks.find(task => task.id === id);
  }

  // Calculate task progress
  async getTaskProgress(taskId: string): Promise<TaskProgress> {
    const task = await this.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const acceptanceCriteriaCompleted = task.acceptanceCriteria?.filter(ac => ac.completed).length || 0;
    const acceptanceCriteriaTotal = task.acceptanceCriteria?.length || 0;
    
    const technicalImplementationCompleted = task.technicalImplementation?.filter(ti => ti.completed).length || 0;
    const technicalImplementationTotal = task.technicalImplementation?.length || 0;

    // Calculate completion percentage based on both acceptance criteria and technical implementation
    const totalItems = acceptanceCriteriaTotal + technicalImplementationTotal;
    const completedItems = acceptanceCriteriaCompleted + technicalImplementationCompleted;
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Check if task is blocked by dependencies
    const blockedBy = await this.getBlockingDependencies(taskId);
    const isBlocked = blockedBy.length > 0;
    const canStart = !isBlocked && task.status === 'not-started';

    return {
      taskId,
      completionPercentage,
      acceptanceCriteriaCompleted,
      acceptanceCriteriaTotal,
      technicalImplementationCompleted,
      technicalImplementationTotal,
      isBlocked,
      blockedBy,
      canStart
    };
  }

  // Get overall project progress
  async getProjectProgress(): Promise<ProjectProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/progress`);
      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching project progress from TaskMaster API:', error);
      // Fallback to local calculation
      return await this.calculateProjectProgressLocally();
    }
  }

  // Fallback method for calculating project progress locally
  private async calculateProjectProgressLocally(): Promise<ProjectProgress> {
    const tasks = await this.getAllTasks();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    
    // Calculate blocked tasks
    const blockedTasksCount = await this.getBlockedTasksCount(tasks);

    const overallCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const estimatedRemainingHours = tasks
      .filter(task => task.status !== 'completed')
      .reduce((total, task) => total + (task.estimatedHours || 0), 0);
    
    const actualHoursSpent = tasks
      .filter(task => task.actualHours)
      .reduce((total, task) => total + (task.actualHours || 0), 0);

    const sprintProgress = await this.calculateSprintProgress(tasks);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks: blockedTasksCount,
      overallCompletionPercentage,
      estimatedRemainingHours,
      actualHoursSpent,
      currentSprint: 1, // Currently in Sprint 1
      sprintProgress
    };
  }

  // Get next task recommendation from TaskMaster API
  async getNextTaskRecommendation(): Promise<NextTaskRecommendation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/next-recommendation`);
      if (!response.ok) {
        // Fallback to local calculation if endpoint doesn't exist
        return await this.calculateNextRecommendation();
      }
      const data = await response.json();
      return data.recommendation || null;
    } catch (error) {
      console.error('Error fetching recommendation from TaskMaster API:', error);
      return await this.calculateNextRecommendation();
    }
  }

  // Update task status via TaskMaster API
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update task status: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Update acceptance criteria via TaskMaster API
  async updateAcceptanceCriteria(taskId: string, criteriaId: string, completed: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/acceptance-criteria/${criteriaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update acceptance criteria: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating acceptance criteria:', error);
      throw error;
    }
  }

  // Update technical implementation via TaskMaster API
  async updateTechnicalImplementation(taskId: string, implementationId: string, completed: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}/technical-implementation/${implementationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update technical implementation: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating technical implementation:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getBlockingDependencies(taskId: string): Promise<string[]> {
    const task = await this.getTaskById(taskId);
    if (!task || !task.dependencies) return [];

    const tasks = await this.getAllTasks();
    return task.dependencies
      .filter(dep => dep.type === 'blocks')
      .map(dep => dep.taskId)
      .filter(depTaskId => {
        const depTask = tasks.find(t => t.id === depTaskId);
        return depTask && depTask.status !== 'completed';
      });
  }

  private async getBlockedTasksCount(tasks: Task[]): Promise<number> {
    let blockedCount = 0;
    for (const task of tasks) {
      const blockedBy = await this.getBlockingDependencies(task.id);
      if (blockedBy.length > 0) {
        blockedCount++;
      }
    }
    return blockedCount;
  }

  private async calculateNextRecommendation(): Promise<NextTaskRecommendation | null> {
    const tasks = await this.getAllTasks();
    
    // Get all tasks that can be started (not blocked by dependencies)
    const availableTasks = [];
    for (const task of tasks) {
      const progress = await this.getTaskProgress(task.id);
      if (task.status === 'not-started' && progress.canStart) {
        availableTasks.push(task);
      }
    }

    if (availableTasks.length === 0) {
      return null;
    }

    // Sort by priority (P0 highest) and then by impact
    const sortedTasks = availableTasks.sort((a, b) => {
      // Priority comparison (P0 = 0, P1 = 1, etc.)
      const priorityA = parseInt(a.priority.substring(1));
      const priorityB = parseInt(b.priority.substring(1));
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, prefer tasks that unblock more tasks
      const impactA = this.calculateTaskImpact(a.id, tasks);
      const impactB = this.calculateTaskImpact(b.id, tasks);
      
      return impactB - impactA;
    });

    const nextTask = sortedTasks[0];
    const impact = this.getTaskImpactLevel(nextTask, tasks);
    const reason = this.generateRecommendationReason(nextTask, tasks);

    return {
      taskId: nextTask.id,
      title: nextTask.title,
      priority: nextTask.priority,
      estimatedHours: nextTask.estimatedHours || 0,
      complexity: nextTask.complexity || 1,
      reason,
      readyToStart: true,
      dependencies: nextTask.dependencies?.map(dep => dep.taskId) || [],
      impact
    };
  }

  private calculateTaskImpact(taskId: string, tasks: Task[]): number {
    // Count how many tasks depend on this task
    return tasks.filter(task => 
      task.dependencies?.some(dep => dep.taskId === taskId && dep.type === 'blocks')
    ).length;
  }

  private getTaskImpactLevel(task: Task, tasks: Task[]): 'low' | 'medium' | 'high' | 'critical' {
    const impact = this.calculateTaskImpact(task.id, tasks);
    
    // Critical: P0 tasks or tasks that unblock 5+ other tasks
    if (task.priority === 'P0' || impact >= 5) return 'critical';
    
    // High: P1 tasks or tasks that unblock 3+ other tasks
    if (task.priority === 'P1' || impact >= 3) return 'high';
    
    // Medium: P2 tasks or tasks that unblock 1+ other tasks
    if (task.priority === 'P2' || impact >= 1) return 'medium';
    
    return 'low';
  }

  private generateRecommendationReason(task: Task, tasks: Task[]): string {
    const impact = this.calculateTaskImpact(task.id, tasks);
    const reasons = [];

    // Priority-based reasoning
    if (task.priority === 'P0') {
      reasons.push('🚨 Critical priority - blocks all development');
    } else if (task.priority === 'P1') {
      reasons.push('⚡ High priority - core functionality');
    }

    // Impact analysis
    if (impact >= 3) {
      reasons.push(`🔓 Unblocks ${impact} tasks - high impact`);
    } else if (impact > 0) {
      reasons.push(`🔓 Unblocks ${impact} task${impact > 1 ? 's' : ''}`);
    }

    // Effort and complexity considerations
    const estimatedHours = task.estimatedHours || 0;
    const complexity = task.complexity || 1;
    
    if (estimatedHours <= 2 && complexity <= 3) {
      reasons.push('🎯 Quick win - low effort, low complexity');
    } else if (estimatedHours <= 2) {
      reasons.push('⚡ Quick implementation');
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Ready to start - no blocking dependencies';
  }

  private async calculateSprintProgress(tasks: Task[]): Promise<SprintProgress[]> {
    // Define sprint task mappings
    const sprintMappings = {
      1: { 
        name: 'Foundation & Core Algorithm',
        taskIds: ['TASK-001', 'TASK-002', 'TASK-003A', 'TASK-003B', 'TASK-003C', 'TASK-003D', 'TASK-004A']
      },
      2: { 
        name: 'Advanced UI & User Management',
        taskIds: ['TASK-004B', 'TASK-004C', 'TASK-005', 'TASK-006A', 'TASK-006B', 'TASK-007A', 'TASK-008']
      },
      3: { 
        name: 'Authentication & Export',
        taskIds: ['TASK-006C', 'TASK-006D', 'TASK-006E', 'TASK-007B', 'TASK-007C']
      }
    };

    const sprintProgress: SprintProgress[] = [];

    for (const [sprintNum, sprintData] of Object.entries(sprintMappings)) {
      const sprintTasks = tasks.filter(task => sprintData.taskIds.includes(task.id));
      const completedTasks = sprintTasks.filter(task => task.status === 'completed').length;
      const estimatedHours = sprintTasks.reduce((total, task) => total + (task.estimatedHours || 0), 0);
      const actualHours = sprintTasks.reduce((total, task) => total + (task.actualHours || 0), 0);
      const completionPercentage = sprintTasks.length > 0 ? Math.round((completedTasks / sprintTasks.length) * 100) : 0;

      // Determine risk level based on completion and complexity
      let riskLevel: 'low' | 'medium' | 'high' | 'very-high' = 'low';
      if (completionPercentage < 25) riskLevel = 'high';
      else if (completionPercentage < 50) riskLevel = 'medium';
      else if (completionPercentage < 75) riskLevel = 'low';

      sprintProgress.push({
        sprintNumber: parseInt(sprintNum),
        name: sprintData.name,
        totalTasks: sprintTasks.length,
        completedTasks,
        estimatedHours,
        actualHours,
        completionPercentage,
        riskLevel
      });
    }

    return sprintProgress;
  }

  // Fallback data when MCP server is unavailable
  private getFallbackTasks(): Task[] {
    return [
      {
        id: 'TASK-001',
        title: 'Fix Port Configuration Issues',
        description: 'Resolve port conflicts between frontend and backend services',
        priority: 'P0' as TaskPriority,
        status: 'not-started' as TaskStatus,
        category: 'devops',
        estimatedHours: 2,
        complexity: 2,
        dependencies: [],
        acceptanceCriteria: [
          { id: 'AC-001-1', description: 'Frontend consistently runs on port 3000', completed: false },
          { id: 'AC-001-2', description: 'Backend consistently runs on port 3001', completed: false },
          { id: 'AC-001-3', description: 'No port collision errors during development', completed: false },
          { id: 'AC-001-4', description: 'Updated documentation with correct configuration', completed: false }
        ],
        technicalImplementation: [
          { id: 'TI-001-1', description: 'Update Vite configuration for frontend port', completed: false },
          { id: 'TI-001-2', description: 'Update backend server configuration', completed: false },
          { id: 'TI-001-3', description: 'Update package.json scripts', completed: false },
          { id: 'TI-001-4', description: 'Test port configuration in development', completed: false }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      // Additional fallback tasks would be added here
    ];
  }
}

export const taskService = new TaskService(); 