// TaskMaster Controller for Room of Requirements
// Provides API endpoints for TaskMaster task management system

import { Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// TaskMaster data structure interfaces
interface TaskMasterTask {
  id: string;
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  status: 'not-started' | 'in-progress' | 'review' | 'completed' | 'blocked';
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'testing' | 'documentation';
  estimatedHours: number;
  actualHours?: number;
  complexity: number;
  dependencies: Array<{ taskId: string; type: 'blocks' | 'enables' | 'related' }>;
  acceptanceCriteria: Array<{ id: string; description: string; completed: boolean }>;
  technicalImplementation: Array<{ id: string; description: string; completed: boolean }>;
  parentTaskId?: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
}

interface TaskMasterData {
  tasks: TaskMasterTask[];
  metadata: {
    projectName: string;
    version: string;
    lastUpdated: Date;
    totalTasks: number;
    completedTasks: number;
  };
}

class TaskMasterController {
  private dataPath: string;

  constructor() {
    this.dataPath = join(__dirname, '../../data/taskmaster.json');
  }

  // Load TaskMaster data from file or return default structure
  private loadTaskMasterData(): TaskMasterData {
    try {
      if (existsSync(this.dataPath)) {
        const data = readFileSync(this.dataPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading TaskMaster data:', error);
    }

    // Return default data structure with fallback tasks
    return {
      tasks: [
        {
          id: 'TASK-001',
          title: 'Fix Port Configuration Issues',
          description: 'Resolve port conflicts between frontend and backend services',
          priority: 'P0',
          status: 'not-started',
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
      ],
      metadata: {
        projectName: 'Room of Requirements',
        version: '1.0.0',
        lastUpdated: new Date(),
        totalTasks: 1,
        completedTasks: 0
      }
    };
  }

  // Save TaskMaster data to file
  private saveTaskMasterData(data: TaskMasterData): void {
    try {
      // Update metadata
      data.metadata.lastUpdated = new Date();
      data.metadata.totalTasks = data.tasks.length;
      data.metadata.completedTasks = data.tasks.filter(task => task.status === 'completed').length;

      writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving TaskMaster data:', error);
      throw new Error('Failed to save TaskMaster data');
    }
  }

  // GET /api/v1/taskmaster/tasks - Get all tasks
  getAllTasks = (req: Request, res: Response): void => {
    try {
      const data = this.loadTaskMasterData();
      
      // Calculate progress for each task
      const tasksWithProgress = data.tasks.map(task => {
        const acceptanceCriteriaCompleted = task.acceptanceCriteria.filter(ac => ac.completed).length;
        const acceptanceCriteriaTotal = task.acceptanceCriteria.length;
        const technicalImplementationCompleted = task.technicalImplementation.filter(ti => ti.completed).length;
        const technicalImplementationTotal = task.technicalImplementation.length;
        
        const totalItems = acceptanceCriteriaTotal + technicalImplementationTotal;
        const completedItems = acceptanceCriteriaCompleted + technicalImplementationCompleted;
        const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return {
          ...task,
          progress: {
            completionPercentage,
            acceptanceCriteriaCompleted,
            acceptanceCriteriaTotal,
            technicalImplementationCompleted,
            technicalImplementationTotal
          }
        };
      });

      res.json({
        tasks: tasksWithProgress,
        metadata: data.metadata,
        summary: {
          totalTasks: data.tasks.length,
          completedTasks: data.tasks.filter(t => t.status === 'completed').length,
          inProgressTasks: data.tasks.filter(t => t.status === 'in-progress').length,
          blockedTasks: data.tasks.filter(t => t.status === 'blocked').length,
          notStartedTasks: data.tasks.filter(t => t.status === 'not-started').length
        }
      });
    } catch (error) {
      console.error('Error getting all tasks:', error);
      res.status(500).json({ 
        error: 'Failed to load tasks',
        message: 'Unable to retrieve TaskMaster data'
      });
    }
  };

  // GET /api/v1/taskmaster/tasks/:id - Get task by ID
  getTaskById = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const data = this.loadTaskMasterData();
      const task = data.tasks.find(t => t.id === id);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json({ task });
    } catch (error) {
      console.error('Error getting task by ID:', error);
      res.status(500).json({ 
        error: 'Failed to load task',
        message: 'Unable to retrieve task data'
      });
    }
  };

  // GET /api/v1/taskmaster/progress - Get project progress
  getProjectProgress = (req: Request, res: Response): void => {
    try {
      const data = this.loadTaskMasterData();
      const tasks = data.tasks;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'completed').length;
      const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
      const blockedTasks = tasks.filter(task => task.status === 'blocked').length;
      
      const overallCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const estimatedRemainingHours = tasks
        .filter(task => task.status !== 'completed')
        .reduce((total, task) => total + task.estimatedHours, 0);
      
      const actualHoursSpent = tasks
        .filter(task => task.actualHours)
        .reduce((total, task) => total + (task.actualHours || 0), 0);

      // Calculate sprint progress
      const sprintProgress = this.calculateSprintProgress(tasks);

      res.json({
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        overallCompletionPercentage,
        estimatedRemainingHours,
        actualHoursSpent,
        currentSprint: 1,
        sprintProgress
      });
    } catch (error) {
      console.error('Error getting project progress:', error);
      res.status(500).json({ 
        error: 'Failed to calculate progress',
        message: 'Unable to retrieve project progress data'
      });
    }
  };

  // GET /api/v1/taskmaster/next-recommendation - Get next task recommendation
  getNextRecommendation = (req: Request, res: Response): void => {
    try {
      const data = this.loadTaskMasterData();
      const tasks = data.tasks;

      // Find tasks that can be started (not blocked by dependencies)
      const availableTasks = tasks.filter(task => {
        if (task.status !== 'not-started') return false;
        
        // Check if any dependencies are not completed
        const blockedBy = task.dependencies
          .filter(dep => dep.type === 'blocks')
          .map(dep => dep.taskId)
          .filter(depTaskId => {
            const depTask = tasks.find(t => t.id === depTaskId);
            return depTask && depTask.status !== 'completed';
          });
        
        return blockedBy.length === 0;
      });

      if (availableTasks.length === 0) {
        res.json({ recommendation: null });
        return;
      }

      // Sort by priority and impact
      const sortedTasks = availableTasks.sort((a, b) => {
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

      const recommendation = {
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

      res.json({ recommendation });
    } catch (error) {
      console.error('Error getting next recommendation:', error);
      res.status(500).json({ 
        error: 'Failed to generate recommendation',
        message: 'Unable to calculate next task recommendation'
      });
    }
  };

  // PUT /api/v1/taskmaster/tasks/:id/status - Update task status
  updateTaskStatus = (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['not-started', 'in-progress', 'review', 'completed', 'blocked'].includes(status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }

      const data = this.loadTaskMasterData();
      const taskIndex = data.tasks.findIndex(t => t.id === id);

      if (taskIndex === -1) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      data.tasks[taskIndex].status = status;
      data.tasks[taskIndex].updatedAt = new Date();

      if (status === 'completed') {
        data.tasks[taskIndex].completedAt = new Date();
        // Mark all acceptance criteria and technical implementation as completed
        data.tasks[taskIndex].acceptanceCriteria.forEach(ac => ac.completed = true);
        data.tasks[taskIndex].technicalImplementation.forEach(ti => ti.completed = true);
      }

      this.saveTaskMasterData(data);

      res.json({ 
        message: 'Task status updated successfully',
        task: data.tasks[taskIndex]
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ 
        error: 'Failed to update task status',
        message: 'Unable to save task status update'
      });
    }
  };

  // PUT /api/v1/taskmaster/tasks/:id/acceptance-criteria/:criteriaId - Update acceptance criteria
  updateAcceptanceCriteria = (req: Request, res: Response): void => {
    try {
      const { id, criteriaId } = req.params;
      const { completed } = req.body;

      if (typeof completed !== 'boolean') {
        res.status(400).json({ error: 'Completed must be a boolean value' });
        return;
      }

      const data = this.loadTaskMasterData();
      const task = data.tasks.find(t => t.id === id);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      const criteria = task.acceptanceCriteria.find(ac => ac.id === criteriaId);
      if (!criteria) {
        res.status(404).json({ error: 'Acceptance criteria not found' });
        return;
      }

      criteria.completed = completed;
      task.updatedAt = new Date();

      this.saveTaskMasterData(data);

      res.json({ 
        message: 'Acceptance criteria updated successfully',
        criteria
      });
    } catch (error) {
      console.error('Error updating acceptance criteria:', error);
      res.status(500).json({ 
        error: 'Failed to update acceptance criteria',
        message: 'Unable to save acceptance criteria update'
      });
    }
  };

  // PUT /api/v1/taskmaster/tasks/:id/technical-implementation/:implementationId - Update technical implementation
  updateTechnicalImplementation = (req: Request, res: Response): void => {
    try {
      const { id, implementationId } = req.params;
      const { completed } = req.body;

      if (typeof completed !== 'boolean') {
        res.status(400).json({ error: 'Completed must be a boolean value' });
        return;
      }

      const data = this.loadTaskMasterData();
      const task = data.tasks.find(t => t.id === id);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      const implementation = task.technicalImplementation.find(ti => ti.id === implementationId);
      if (!implementation) {
        res.status(404).json({ error: 'Technical implementation not found' });
        return;
      }

      implementation.completed = completed;
      task.updatedAt = new Date();

      this.saveTaskMasterData(data);

      res.json({ 
        message: 'Technical implementation updated successfully',
        implementation
      });
    } catch (error) {
      console.error('Error updating technical implementation:', error);
      res.status(500).json({ 
        error: 'Failed to update technical implementation',
        message: 'Unable to save technical implementation update'
      });
    }
  };

  // Private helper methods

  private calculateTaskImpact(taskId: string, tasks: TaskMasterTask[]): number {
    return tasks.filter(task => 
      task.dependencies.some(dep => dep.taskId === taskId && dep.type === 'blocks')
    ).length;
  }

  private getTaskImpactLevel(task: TaskMasterTask, tasks: TaskMasterTask[]): 'low' | 'medium' | 'high' | 'critical' {
    const impact = this.calculateTaskImpact(task.id, tasks);
    
    if (task.priority === 'P0' || impact >= 5) return 'critical';
    if (task.priority === 'P1' || impact >= 3) return 'high';
    if (task.priority === 'P2' || impact >= 1) return 'medium';
    
    return 'low';
  }

  private generateRecommendationReason(task: TaskMasterTask, tasks: TaskMasterTask[]): string {
    const impact = this.calculateTaskImpact(task.id, tasks);
    const reasons = [];

    if (task.priority === 'P0') {
      reasons.push('🚨 Critical priority - blocks all development');
    } else if (task.priority === 'P1') {
      reasons.push('⚡ High priority - core functionality');
    }

    if (impact >= 3) {
      reasons.push(`🔓 Unblocks ${impact} tasks - high impact`);
    } else if (impact > 0) {
      reasons.push(`🔓 Unblocks ${impact} task${impact > 1 ? 's' : ''}`);
    }

    if (task.estimatedHours <= 2 && task.complexity <= 3) {
      reasons.push('🎯 Quick win - low effort, low complexity');
    } else if (task.estimatedHours <= 2) {
      reasons.push('⚡ Quick implementation');
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Ready to start - no blocking dependencies';
  }

  private calculateSprintProgress(tasks: TaskMasterTask[]) {
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

    return Object.entries(sprintMappings).map(([sprintNum, sprintData]) => {
      const sprintTasks = tasks.filter(task => sprintData.taskIds.includes(task.id));
      const completedTasks = sprintTasks.filter(task => task.status === 'completed').length;
      const estimatedHours = sprintTasks.reduce((total, task) => total + task.estimatedHours, 0);
      const actualHours = sprintTasks.reduce((total, task) => total + (task.actualHours || 0), 0);
      const completionPercentage = sprintTasks.length > 0 ? Math.round((completedTasks / sprintTasks.length) * 100) : 0;

      let riskLevel: 'low' | 'medium' | 'high' | 'very-high' = 'low';
      if (completionPercentage < 25) riskLevel = 'high';
      else if (completionPercentage < 50) riskLevel = 'medium';
      else if (completionPercentage < 75) riskLevel = 'low';

      return {
        sprintNumber: parseInt(sprintNum),
        name: sprintData.name,
        totalTasks: sprintTasks.length,
        completedTasks,
        estimatedHours,
        actualHours,
        completionPercentage,
        riskLevel
      };
    });
  }
}

export default TaskMasterController; 