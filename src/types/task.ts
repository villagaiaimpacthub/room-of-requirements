// Task Management Types for Room of Requirements
// Generated from TaskMaster High Complexity Breakdown

export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type TaskStatus = 'not-started' | 'in-progress' | 'review' | 'completed' | 'blocked';
export type TaskCategory = 'frontend' | 'backend' | 'database' | 'devops' | 'testing' | 'documentation';

export interface TaskDependency {
  taskId: string;
  type: 'blocks' | 'enables' | 'related';
}

export interface AcceptanceCriteria {
  id: string;
  description: string;
  completed: boolean;
}

export interface TechnicalImplementation {
  id: string;
  description: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  estimatedHours: number;
  actualHours?: number;
  complexity: number; // 1-10 scale
  dependencies: TaskDependency[];
  acceptanceCriteria: AcceptanceCriteria[];
  technicalImplementation: TechnicalImplementation[];
  parentTaskId?: string; // For subtasks
  subtasks?: Task[];
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface TaskProgress {
  taskId: string;
  completionPercentage: number;
  acceptanceCriteriaCompleted: number;
  acceptanceCriteriaTotal: number;
  technicalImplementationCompleted: number;
  technicalImplementationTotal: number;
  isBlocked: boolean;
  blockedBy: string[];
  canStart: boolean;
}

export interface ProjectProgress {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overallCompletionPercentage: number;
  estimatedRemainingHours: number;
  actualHoursSpent: number;
  currentSprint: number;
  sprintProgress: SprintProgress[];
}

export interface SprintProgress {
  sprintNumber: number;
  name: string;
  totalTasks: number;
  completedTasks: number;
  estimatedHours: number;
  actualHours: number;
  completionPercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
}

export interface NextTaskRecommendation {
  taskId: string;
  title: string;
  priority: TaskPriority;
  estimatedHours: number;
  complexity: number;
  reason: string;
  readyToStart: boolean;
  dependencies: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
}

// Task Data from TaskMaster Breakdown
export const TASKMASTER_TASKS: Task[] = [
  // SPRINT 1 TASKS
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
  },
  {
    id: 'TASK-002',
    title: 'Implement Task Management Data Models',
    description: 'Create comprehensive TypeScript interfaces for task management',
    priority: 'P1',
    status: 'not-started',
    category: 'frontend',
    estimatedHours: 4,
    complexity: 3,
    dependencies: [],
    acceptanceCriteria: [
      { id: 'AC-002-1', description: 'Complete TypeScript interfaces in src/types/task.ts', completed: false },
      { id: 'AC-002-2', description: 'Priority levels (P0-P4) and status enums defined', completed: false },
      { id: 'AC-002-3', description: 'Dependency mapping and estimation structures', completed: false },
      { id: 'AC-002-4', description: 'Comprehensive documentation and exports', completed: false }
    ],
    technicalImplementation: [
      { id: 'TI-002-1', description: 'Create task interface definitions', completed: false },
      { id: 'TI-002-2', description: 'Define enums for priority and status', completed: false },
      { id: 'TI-002-3', description: 'Create dependency and progress tracking types', completed: false },
      { id: 'TI-002-4', description: 'Add comprehensive JSDoc documentation', completed: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // TASK-003 Subtasks
  {
    id: 'TASK-003A',
    title: 'PRD Content Parser',
    description: 'Parse PRD markdown sections into structured data',
    priority: 'P1',
    status: 'not-started',
    category: 'backend',
    estimatedHours: 2,
    complexity: 4,
    dependencies: [{ taskId: 'TASK-002', type: 'blocks' }],
    parentTaskId: 'TASK-003',
    acceptanceCriteria: [
      { id: 'AC-003A-1', description: 'Parse PRD markdown sections (Introduction, Features, User Stories, Technical Requirements)', completed: false },
      { id: 'AC-003A-2', description: 'Extract structured data with proper validation', completed: false },
      { id: 'AC-003A-3', description: 'Handle malformed or incomplete PRD content gracefully', completed: false },
      { id: 'AC-003A-4', description: 'Create reusable parsing utilities', completed: false }
    ],
    technicalImplementation: [
      { id: 'TI-003A-1', description: 'Create src/services/prdParser.ts', completed: false },
      { id: 'TI-003A-2', description: 'Implement markdown section detection and extraction', completed: false },
      { id: 'TI-003A-3', description: 'Add JSON schema validation for parsed data', completed: false },
      { id: 'TI-003A-4', description: 'Create unit tests for parsing edge cases', completed: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'TASK-003B',
    title: 'Task Generation Rules Engine',
    description: 'Create rules engine for generating tasks from PRD content',
    priority: 'P1',
    status: 'not-started',
    category: 'backend',
    estimatedHours: 2,
    complexity: 5,
    dependencies: [
      { taskId: 'TASK-002', type: 'blocks' },
      { taskId: 'TASK-003A', type: 'blocks' }
    ],
    parentTaskId: 'TASK-003',
    acceptanceCriteria: [
      { id: 'AC-003B-1', description: 'Define rules for Frontend tasks (components, pages, styling, routing)', completed: false },
      { id: 'AC-003B-2', description: 'Define rules for Backend tasks (APIs, middleware, services, database)', completed: false },
      { id: 'AC-003B-3', description: 'Define rules for DevOps tasks (deployment, CI/CD, monitoring)', completed: false },
      { id: 'AC-003B-4', description: 'Create task templates with proper categorization', completed: false }
    ],
    technicalImplementation: [
      { id: 'TI-003B-1', description: 'Create task generation rule definitions in JSON/TypeScript', completed: false },
      { id: 'TI-003B-2', description: 'Implement template system for different task types', completed: false },
      { id: 'TI-003B-3', description: 'Add task categorization and tagging logic', completed: false },
      { id: 'TI-003B-4', description: 'Create validation for rule consistency', completed: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'TASK-003C',
    title: 'Effort Estimation Algorithm',
    description: 'Implement effort estimation based on task complexity and type',
    priority: 'P1',
    status: 'not-started',
    category: 'backend',
    estimatedHours: 1.5,
    complexity: 4,
    dependencies: [
      { taskId: 'TASK-003A', type: 'blocks' },
      { taskId: 'TASK-003B', type: 'blocks' }
    ],
    parentTaskId: 'TASK-003',
    acceptanceCriteria: [
      { id: 'AC-003C-1', description: 'Estimate effort based on task type and complexity', completed: false },
      { id: 'AC-003C-2', description: 'Use historical data patterns for calibration', completed: false },
      { id: 'AC-003C-3', description: 'Implement complexity scoring (1-10 scale)', completed: false },
      { id: 'AC-003C-4', description: 'Provide confidence intervals for estimates', completed: false }
    ],
    technicalImplementation: [
      { id: 'TI-003C-1', description: 'Create effort estimation algorithms based on task characteristics', completed: false },
      { id: 'TI-003C-2', description: 'Define complexity scoring criteria for different task types', completed: false },
      { id: 'TI-003C-3', description: 'Implement estimation rules with adjustable parameters', completed: false },
      { id: 'TI-003C-4', description: 'Add estimation validation and adjustment mechanisms', completed: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'TASK-003D',
    title: 'Dependency Detection Logic',
    description: 'Automatically detect dependencies between generated tasks',
    priority: 'P1',
    status: 'not-started',
    category: 'backend',
    estimatedHours: 1.5,
    complexity: 5,
    dependencies: [
      { taskId: 'TASK-003A', type: 'blocks' },
      { taskId: 'TASK-003B', type: 'blocks' },
      { taskId: 'TASK-003C', type: 'blocks' }
    ],
    parentTaskId: 'TASK-003',
    acceptanceCriteria: [
      { id: 'AC-003D-1', description: 'Automatically detect dependencies between generated tasks', completed: false },
      { id: 'AC-003D-2', description: 'Assign priorities based on dependency chains', completed: false },
      { id: 'AC-003D-3', description: 'Create dependency mapping for visualization', completed: false },
      { id: 'AC-003D-4', description: 'Prevent circular dependencies', completed: false }
    ],
    technicalImplementation: [
      { id: 'TI-003D-1', description: 'Implement dependency detection algorithms', completed: false },
      { id: 'TI-003D-2', description: 'Create dependency graph data structures', completed: false },
      { id: 'TI-003D-3', description: 'Add priority assignment based on critical path', completed: false },
      { id: 'TI-003D-4', description: 'Create circular dependency detection and prevention', completed: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // TASK-004 Subtasks
  {
    id: 'TASK-004A',
    title: 'Basic Task Components',
    description: 'Create fundamental task management UI components',
    priority: 'P1',
    status: 'not-started',
    category: 'frontend',
    estimatedHours: 3,
    complexity: 4,
    dependencies: [{ taskId: 'TASK-002', type: 'blocks' }],
    parentTaskId: 'TASK-004',
    acceptanceCriteria: [
      { id: 'AC-004A-1', description: 'TaskCard component with status indicators and actions', completed: false },
      { id: 'AC-004A-2', description: 'TaskList component with filtering and sorting', completed: false },
      { id: 'AC-004A-3', description: 'TaskForm for creating and editing tasks', completed: false },
      { id: 'AC-004A-4', description: 'Responsive design for mobile and desktop', completed: false }
    ],
    technicalImplementation: [
      { id: 'TI-004A-1', description: 'Create src/components/TaskManagement/ directory structure', completed: false },
      { id: 'TI-004A-2', description: 'Build TaskCard with status display, priority indicators, and action buttons', completed: false },
      { id: 'TI-004A-3', description: 'Implement TaskList with search, filter, and sort functionality', completed: false },
      { id: 'TI-004A-4', description: 'Create TaskForm with validation and error handling', completed: false },
      { id: 'TI-004A-5', description: 'Style all components with Tailwind CSS and consistent design system', completed: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  // Additional tasks would continue here...
];

export interface TaskService {
  getAllTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  getTaskProgress(taskId: string): Promise<TaskProgress>;
  getProjectProgress(): Promise<ProjectProgress>;
  getNextTaskRecommendation(): Promise<NextTaskRecommendation | null>;
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
  updateAcceptanceCriteria(taskId: string, criteriaId: string, completed: boolean): Promise<void>;
  updateTechnicalImplementation(taskId: string, implementationId: string, completed: boolean): Promise<void>;
} 