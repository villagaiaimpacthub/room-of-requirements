// Task Service for Room of Requirements
// Handles task management, progress tracking, and recommendations

import {
  Task,
  TaskProgress,
  ProjectProgress,
  NextTaskRecommendation,
  TaskStatus,
  TaskPriority,
  SprintProgress,
  TASKMASTER_TASKS,
  TaskService as ITaskService
} from '../types/task';

class TaskService implements ITaskService {
  private tasks: Task[] = [...TASKMASTER_TASKS];

  // Get all tasks
  getAllTasks(): Task[] {
    return this.tasks;
  }

  // Get task by ID
  getTaskById(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }

  // Calculate task progress
  getTaskProgress(taskId: string): TaskProgress {
    const task = this.getTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const acceptanceCriteriaCompleted = task.acceptanceCriteria.filter(ac => ac.completed).length;
    const acceptanceCriteriaTotal = task.acceptanceCriteria.length;
    
    const technicalImplementationCompleted = task.technicalImplementation.filter(ti => ti.completed).length;
    const technicalImplementationTotal = task.technicalImplementation.length;

    // Calculate completion percentage based on both acceptance criteria and technical implementation
    const totalItems = acceptanceCriteriaTotal + technicalImplementationTotal;
    const completedItems = acceptanceCriteriaCompleted + technicalImplementationCompleted;
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Check if task is blocked by dependencies
    const blockedBy = this.getBlockingDependencies(taskId);
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
  getProjectProgress(): ProjectProgress {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = this.tasks.filter(task => task.status === 'in-progress').length;
    const blockedTasks = this.tasks.filter(task => this.getTaskProgress(task.id).isBlocked).length;

    const overallCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const estimatedRemainingHours = this.tasks
      .filter(task => task.status !== 'completed')
      .reduce((total, task) => total + task.estimatedHours, 0);
    
    const actualHoursSpent = this.tasks
      .filter(task => task.actualHours)
      .reduce((total, task) => total + (task.actualHours || 0), 0);

    const sprintProgress = this.calculateSprintProgress();

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overallCompletionPercentage,
      estimatedRemainingHours,
      actualHoursSpent,
      currentSprint: 1, // Currently in Sprint 1
      sprintProgress
    };
  }

  // Get next task recommendation based on dependencies and priorities
  getNextTaskRecommendation(): NextTaskRecommendation | null {
    // Get all tasks that can be started (not blocked by dependencies)
    const availableTasks = this.tasks.filter(task => {
      const progress = this.getTaskProgress(task.id);
      return task.status === 'not-started' && progress.canStart;
    });

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
      const impactA = this.calculateTaskImpact(a.id);
      const impactB = this.calculateTaskImpact(b.id);
      
      return impactB - impactA;
    });

    const nextTask = sortedTasks[0];
    const impact = this.getTaskImpactLevel(nextTask.id);
    const reason = this.generateRecommendationReason(nextTask);

    return {
      taskId: nextTask.id,
      title: nextTask.title,
      priority: nextTask.priority,
      estimatedHours: nextTask.estimatedHours,
      complexity: nextTask.complexity,
      reason,
      readyToStart: true,
      dependencies: nextTask.dependencies.map(dep => dep.taskId),
      impact
    };
  }

  // Update task status
  updateTaskStatus(taskId: string, status: TaskStatus): void {
    const task = this.getTaskById(taskId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date();
      
      if (status === 'completed') {
        task.completedAt = new Date();
        // Mark all acceptance criteria and technical implementation as completed
        task.acceptanceCriteria.forEach(ac => ac.completed = true);
        task.technicalImplementation.forEach(ti => ti.completed = true);
      }
    }
  }

  // Update acceptance criteria
  updateAcceptanceCriteria(taskId: string, criteriaId: string, completed: boolean): void {
    const task = this.getTaskById(taskId);
    if (task) {
      const criteria = task.acceptanceCriteria.find(ac => ac.id === criteriaId);
      if (criteria) {
        criteria.completed = completed;
        task.updatedAt = new Date();
        
        // Auto-update task status based on completion
        this.autoUpdateTaskStatus(taskId);
      }
    }
  }

  // Update technical implementation
  updateTechnicalImplementation(taskId: string, implementationId: string, completed: boolean): void {
    const task = this.getTaskById(taskId);
    if (task) {
      const implementation = task.technicalImplementation.find(ti => ti.id === implementationId);
      if (implementation) {
        implementation.completed = completed;
        task.updatedAt = new Date();
        
        // Auto-update task status based on completion
        this.autoUpdateTaskStatus(taskId);
      }
    }
  }

  // Private helper methods

  private getBlockingDependencies(taskId: string): string[] {
    const task = this.getTaskById(taskId);
    if (!task) return [];

    return task.dependencies
      .filter(dep => dep.type === 'blocks')
      .map(dep => dep.taskId)
      .filter(depTaskId => {
        const depTask = this.getTaskById(depTaskId);
        return depTask && depTask.status !== 'completed';
      });
  }

  private calculateTaskImpact(taskId: string): number {
    // Count how many tasks depend on this task
    return this.tasks.filter(task => 
      task.dependencies.some(dep => dep.taskId === taskId && dep.type === 'blocks')
    ).length;
  }

  private getTaskImpactLevel(taskId: string): 'low' | 'medium' | 'high' | 'critical' {
    const impact = this.calculateTaskImpact(taskId);
    const task = this.getTaskById(taskId);
    
    if (!task) return 'low';
    
    // Critical: P0 tasks or tasks that unblock 5+ other tasks
    if (task.priority === 'P0' || impact >= 5) return 'critical';
    
    // High: P1 tasks or tasks that unblock 3+ other tasks
    if (task.priority === 'P1' || impact >= 3) return 'high';
    
    // Medium: P2 tasks or tasks that unblock 1+ other tasks
    if (task.priority === 'P2' || impact >= 1) return 'medium';
    
    return 'low';
  }

  private generateRecommendationReason(task: Task): string {
    const impact = this.calculateTaskImpact(task.id);
    const reasons = [];

    if (task.priority === 'P0') {
      reasons.push('Critical priority task');
    } else if (task.priority === 'P1') {
      reasons.push('High priority task');
    }

    if (impact > 0) {
      reasons.push(`Unblocks ${impact} other task${impact > 1 ? 's' : ''}`);
    }

    if (task.estimatedHours <= 2) {
      reasons.push('Quick win (≤2 hours)');
    }

    if (task.complexity <= 3) {
      reasons.push('Low complexity');
    }

    if (reasons.length === 0) {
      reasons.push('Ready to start with no dependencies');
    }

    return reasons.join(', ');
  }

  private autoUpdateTaskStatus(taskId: string): void {
    const progress = this.getTaskProgress(taskId);
    const task = this.getTaskById(taskId);
    
    if (!task) return;

    if (progress.completionPercentage === 100 && task.status !== 'completed') {
      this.updateTaskStatus(taskId, 'completed');
    } else if (progress.completionPercentage > 0 && task.status === 'not-started') {
      this.updateTaskStatus(taskId, 'in-progress');
    }
  }

  private calculateSprintProgress(): SprintProgress[] {
    // Define sprint task groupings based on our TaskMaster breakdown
    const sprint1Tasks = ['TASK-001', 'TASK-002', 'TASK-003A', 'TASK-003B', 'TASK-003C', 'TASK-003D', 'TASK-004A'];
    const sprint2Tasks = ['TASK-004B', 'TASK-004C', 'TASK-005', 'TASK-006A', 'TASK-006B', 'TASK-007A', 'TASK-008'];
    const sprint3Tasks = ['TASK-006C', 'TASK-006D', 'TASK-006E', 'TASK-007B', 'TASK-007C'];

    const sprints = [
      { number: 1, name: 'Foundation & Core Algorithm', taskIds: sprint1Tasks, estimatedHours: 16 },
      { number: 2, name: 'Advanced UI & User Management', taskIds: sprint2Tasks, estimatedHours: 22.5 },
      { number: 3, name: 'Authentication & Export', taskIds: sprint3Tasks, estimatedHours: 18 }
    ];

    return sprints.map(sprint => {
      const sprintTasks = this.tasks.filter(task => sprint.taskIds.includes(task.id));
      const completedTasks = sprintTasks.filter(task => task.status === 'completed').length;
      const totalTasks = sprintTasks.length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const actualHours = sprintTasks
        .filter(task => task.actualHours)
        .reduce((total, task) => total + (task.actualHours || 0), 0);

      // Determine risk level based on completion and complexity
      let riskLevel: 'low' | 'medium' | 'high' | 'very-high' = 'medium';
      if (completionPercentage >= 80) riskLevel = 'low';
      else if (completionPercentage >= 50) riskLevel = 'medium';
      else if (completionPercentage >= 20) riskLevel = 'high';
      else riskLevel = 'very-high';

      return {
        sprintNumber: sprint.number,
        name: sprint.name,
        totalTasks,
        completedTasks,
        estimatedHours: sprint.estimatedHours,
        actualHours,
        completionPercentage,
        riskLevel
      };
    });
  }
}

// Export singleton instance
export const taskService = new TaskService();
export default taskService; 