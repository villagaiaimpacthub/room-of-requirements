# TaskMaster AI MCP Server Integration Guide
*Room of Requirements Project - Dependency-Driven Task Prioritization*

## 🎯 **Overview**

This guide ensures the TaskMaster AI MCP server follows proper task prioritization based on:
- **Dependency chains** - Tasks that unblock other tasks get higher priority
- **PRD context** - Tasks aligned with core product requirements
- **Critical path analysis** - Tasks on the longest dependency chain
- **Impact assessment** - Tasks that enable the most downstream work

The TaskMaster dashboard has been upgraded to fetch real-time data from a backend API instead of using static data files. This ensures the dashboard always displays the most current and accurate task information, eliminating the risk of outdated data.

## 📋 **Key Files for MCP Server Reference**

### **Primary Task Data Sources**
```
📁 Project Root
├── 📄 scripts/room-of-requirements-prd.md          # Main PRD (NOT template)
├── 📄 TASKMASTER_HIGH_COMPLEXITY_BREAKDOWN.md      # Detailed task breakdown
├── 📄 TASKMASTER_REFINED_TASKS.md                  # Optimized task list
├── 📄 src/types/task.ts                            # Task data structure
└── 📄 src/services/taskService.ts                  # Task logic & dependencies
```

### **Template Files (DO NOT USE)**
```
❌ scripts/your-prd-template.md                     # Template only
❌ scripts/example-prd.md                           # Example only  
❌ scripts/your-requirements.md                     # Template only
```

---

## 🔄 **TaskMaster AI Workflow**

### **Step 1: Show Tasks Command**
When user runs `show tasks`, the MCP server should:

1. **Load Current State**
   ```typescript
   // Read from src/services/taskService.ts
   const allTasks = taskService.getAllTasks();
   const projectProgress = taskService.getProjectProgress();
   const nextRecommendation = taskService.getNextTaskRecommendation();
   ```

2. **Display Task Overview**
   - Total tasks: 25 subtasks
   - Current completion: 0%
   - Current sprint: Sprint 1 (Foundation & Core Algorithm)
   - Next recommended task with reasoning

### **Step 2: Dependency-Based Prioritization**

The system follows this priority algorithm:

```typescript
// Priority Calculation (from taskService.ts)
1. P0 tasks (Critical) - Must be done first
2. Tasks with no blocking dependencies
3. Tasks that unblock the most other tasks
4. Tasks on the critical path to project completion
5. Quick wins (≤2 hours) with low complexity
```

### **Step 3: Context-Aware Recommendations**

Each recommendation includes:
- **Why this task now**: Dependency reasoning
- **Impact**: How many tasks this unblocks
- **PRD alignment**: Which PRD section this supports
- **Risk assessment**: Complexity and effort analysis

---

## 🎯 **Current Task Priority Order**

Based on dependencies and PRD context:

### **🚨 IMMEDIATE PRIORITY (Sprint 1 - Week 1)**

#### **TASK-001: Fix Port Configuration Issues** 
- **Priority**: P0 (Critical)
- **Effort**: 2 hours
- **Dependencies**: None
- **Unblocks**: All development work
- **PRD Context**: Technical Requirements - Development Environment
- **Why First**: Blocks all other development until resolved

#### **TASK-002: Implement Task Management Data Models**
- **Priority**: P1 (High) 
- **Effort**: 4 hours
- **Dependencies**: None
- **Unblocks**: TASK-003A, TASK-003B, TASK-004A (3 tasks)
- **PRD Context**: Technical Requirements - Data Architecture
- **Why Second**: Foundation for all task management features

### **🔧 FOUNDATION TASKS (Sprint 1 - Week 2)**

#### **TASK-003A: PRD Content Parser**
- **Priority**: P1 (High)
- **Effort**: 2 hours  
- **Dependencies**: TASK-002
- **Unblocks**: TASK-003B, TASK-003C (2 tasks)
- **PRD Context**: Core Features - PRD Processing
- **Why Next**: Enables automated task generation from PRDs

#### **TASK-003B: Task Generation Rules Engine**
- **Priority**: P1 (High)
- **Effort**: 2 hours
- **Dependencies**: TASK-002, TASK-003A
- **Unblocks**: TASK-003C, TASK-003D (2 tasks)
- **PRD Context**: Core Features - Intelligent Task Breakdown
- **Why Next**: Core algorithm for the entire system

### **📊 ALGORITHM COMPLETION (Sprint 1 - Week 3)**

#### **TASK-003C: Effort Estimation Algorithm**
- **Priority**: P1 (High)
- **Effort**: 1.5 hours
- **Dependencies**: TASK-003A, TASK-003B
- **Unblocks**: TASK-003D (1 task)
- **PRD Context**: Core Features - Project Planning
- **Why Next**: Enables accurate project estimation

#### **TASK-003D: Dependency Detection Logic**
- **Priority**: P1 (High)
- **Effort**: 1.5 hours
- **Dependencies**: TASK-003A, TASK-003B, TASK-003C
- **Unblocks**: Advanced task management features
- **PRD Context**: Core Features - Intelligent Task Ordering
- **Why Next**: Completes the core algorithm

### **🎨 UI FOUNDATION (Sprint 1 - Week 4)**

#### **TASK-004A: Basic Task Components**
- **Priority**: P1 (High)
- **Effort**: 3 hours
- **Dependencies**: TASK-002
- **Unblocks**: TASK-004B, TASK-004C (2 tasks)
- **PRD Context**: User Interface - Task Management UI
- **Why Next**: Foundation for all task UI components

---

## 🔍 **MCP Server Commands**

### **Core Commands for Task Management**

```bash
# Show current task status and next recommendation
show tasks

# Start a specific task (updates status to 'in-progress')
start task TASK-001

# Complete a task (updates status to 'completed')
complete task TASK-001

# Show detailed task information
show task TASK-001

# Show dependency graph
show dependencies

# Show sprint progress
show sprint 1

# Show critical path
show critical-path

# Update task progress
update task TASK-001 progress 50

# Mark acceptance criteria as complete
complete criteria TASK-001 AC-001-1

# Mark technical implementation as complete  
complete implementation TASK-001 TI-001-1
```

### **Advanced Analysis Commands**

```bash
# Show tasks ready to start (no blocking dependencies)
show ready-tasks

# Show blocked tasks and what's blocking them
show blocked-tasks

# Show impact analysis (which tasks unblock the most work)
show impact-analysis

# Show quick wins (low effort, high impact tasks)
show quick-wins

# Validate task dependencies for circular references
validate dependencies

# Show project timeline based on current progress
show timeline
```

---

## 📊 **Dependency Chain Analysis**

### **Critical Path Tasks (Must be done in order)**
```
TASK-001 → TASK-002 → TASK-003A → TASK-003B → TASK-003C → TASK-003D
```

### **Parallel Development Tracks**
```
Track 1: UI Components
TASK-002 → TASK-004A → TASK-004B → TASK-004C

Track 2: Core Algorithm  
TASK-002 → TASK-003A → TASK-003B → TASK-003C → TASK-003D

Track 3: Authentication (Sprint 2)
TASK-006A → TASK-006B → TASK-006C → TASK-006D → TASK-006E
```

### **High-Impact Tasks (Unblock Multiple Tasks)**
1. **TASK-002** - Unblocks 3 tasks (TASK-003A, TASK-003B, TASK-004A)
2. **TASK-003A** - Unblocks 2 tasks (TASK-003B, TASK-003C)  
3. **TASK-003B** - Unblocks 2 tasks (TASK-003C, TASK-003D)
4. **TASK-004A** - Unblocks 2 tasks (TASK-004B, TASK-004C)

---

## 🎯 **PRD Alignment Matrix**

### **Core PRD Sections → Task Mapping**

| PRD Section | Primary Tasks | Priority |
|-------------|---------------|----------|
| **Technical Requirements** | TASK-001, TASK-002 | P0-P1 |
| **Core Features - Task Breakdown** | TASK-003A, TASK-003B, TASK-003C, TASK-003D | P1 |
| **User Interface - Task Management** | TASK-004A, TASK-004B, TASK-004C | P1 |
| **User Management** | TASK-006A, TASK-006B, TASK-006C, TASK-006D, TASK-006E | P2 |
| **Advanced Features** | TASK-005, TASK-007A, TASK-007B, TASK-007C, TASK-008 | P2-P3 |

### **Feature Priority Alignment**
- **MVP Core**: Tasks 001-004 (Foundation + Core Algorithm + Basic UI)
- **Enhanced Features**: Tasks 005-008 (Advanced UI + User Management)  
- **Production Ready**: Authentication + Export + Documentation

---

## 🚀 **Sprint Planning Integration**

### **Sprint 1: Foundation & Core Algorithm (16 hours)**
**Goal**: Establish development environment and core task generation algorithm

**Week 1**: TASK-001 (2h), TASK-002 (4h) = 6h
**Week 2**: TASK-003A (2h), TASK-003B (2h) = 4h  
**Week 3**: TASK-003C (1.5h), TASK-003D (1.5h) = 3h
**Week 4**: TASK-004A (3h) = 3h

**Sprint Success Criteria**:
- ✅ Development environment stable
- ✅ Task data models complete
- ✅ Core algorithm functional
- ✅ Basic UI components ready

### **Sprint 2: Advanced UI & User Management (22.5 hours)**
**Dependencies**: Sprint 1 completion
**Focus**: User interface and authentication system

### **Sprint 3: Authentication & Export (18 hours)**  
**Dependencies**: Sprint 2 completion
**Focus**: Production readiness and advanced features

---

## 🔧 **MCP Server Implementation Notes**

### **Task State Management**
- Tasks are stored in `src/services/taskService.ts`
- Progress tracking via acceptance criteria and technical implementation
- Automatic status updates based on completion percentage
- Dependency validation prevents starting blocked tasks

### **Recommendation Engine**
- Prioritizes P0 tasks first
- Considers dependency chains and impact analysis
- Factors in effort estimation and complexity
- Provides contextual reasoning for each recommendation

### **Integration Points**
- Dashboard shows read-only progress visualization
- MCP commands update task state in real-time
- WebSocket integration for live updates (future enhancement)
- Export capabilities for external project management tools

---

## ✅ **Success Metrics**

### **Task Completion Tracking**
- **Sprint Velocity**: Tasks completed per sprint
- **Dependency Resolution**: Blocked tasks becoming unblocked
- **Critical Path Progress**: Movement along the longest dependency chain
- **PRD Coverage**: Percentage of PRD requirements with associated tasks

### **Quality Indicators**
- **Acceptance Criteria Completion**: Detailed progress tracking
- **Technical Implementation**: Code-level completion tracking  
- **Dependency Accuracy**: No circular dependencies or invalid references
- **Estimation Accuracy**: Actual vs estimated effort tracking

---

## 🎯 **Next Steps for MCP Integration**

1. **Validate Current Task Data**: Ensure all 25 subtasks have proper dependencies
2. **Test Recommendation Engine**: Verify priority algorithm works correctly
3. **Implement MCP Commands**: Create command handlers for task management
4. **Add Progress Tracking**: Real-time updates for task completion
5. **Create Validation Rules**: Prevent invalid state transitions
6. **Add Export Capabilities**: Integration with external tools

This guide ensures the TaskMaster AI MCP server maintains proper task prioritization based on dependencies, PRD alignment, and project impact analysis. 

## Architecture

### Before: Static Data Approach
- Task data was stored in `src/types/task.ts` as a static array
- Dashboard read from this static data source
- Risk of data becoming outdated
- No real-time updates or persistence

### After: MCP Server Integration
- Task data is managed by a backend API (`TaskMasterController`)
- Dashboard fetches data via HTTP requests
- Real-time updates and persistence
- Consistent with MCP server format and methodology

## API Endpoints

### Base URL: `http://localhost:3001/api/v1/taskmaster`

#### GET `/tasks`
Retrieves all TaskMaster tasks with progress calculations.

**Response:**
```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Fix Port Configuration Issues",
      "description": "Resolve port conflicts between frontend and backend services",
      "priority": "P0",
      "status": "not-started",
      "category": "devops",
      "estimatedHours": 2,
      "complexity": 2,
      "dependencies": [],
      "acceptanceCriteria": [...],
      "technicalImplementation": [...],
      "progress": {
        "completionPercentage": 0,
        "acceptanceCriteriaCompleted": 0,
        "acceptanceCriteriaTotal": 4,
        "technicalImplementationCompleted": 0,
        "technicalImplementationTotal": 4
      }
    }
  ],
  "metadata": {
    "projectName": "Room of Requirements",
    "version": "1.0.0",
    "lastUpdated": "2025-05-26T23:01:00.000Z",
    "totalTasks": 1,
    "completedTasks": 0
  },
  "summary": {
    "totalTasks": 1,
    "completedTasks": 0,
    "inProgressTasks": 0,
    "blockedTasks": 0,
    "notStartedTasks": 1
  }
}
```

#### GET `/tasks/:id`
Retrieves a specific task by ID.

#### GET `/progress`
Retrieves overall project progress including sprint breakdowns.

**Response:**
```json
{
  "totalTasks": 1,
  "completedTasks": 0,
  "inProgressTasks": 0,
  "blockedTasks": 0,
  "overallCompletionPercentage": 0,
  "estimatedRemainingHours": 2,
  "actualHoursSpent": 0,
  "currentSprint": 1,
  "sprintProgress": [
    {
      "sprintNumber": 1,
      "name": "Foundation & Core Algorithm",
      "totalTasks": 1,
      "completedTasks": 0,
      "estimatedHours": 2,
      "actualHours": 0,
      "completionPercentage": 0,
      "riskLevel": "high"
    }
  ]
}
```

#### GET `/next-recommendation`
Retrieves AI-powered next task recommendation.

**Response:**
```json
{
  "recommendation": {
    "taskId": "TASK-001",
    "title": "Fix Port Configuration Issues",
    "priority": "P0",
    "estimatedHours": 2,
    "complexity": 2,
    "reason": "🚨 Critical priority - blocks all development • 🎯 Quick win - low effort, low complexity",
    "readyToStart": true,
    "dependencies": [],
    "impact": "critical"
  }
}
```

#### PUT `/tasks/:id/status`
Updates task status.

**Request Body:**
```json
{
  "status": "in-progress"
}
```

#### PUT `/tasks/:id/acceptance-criteria/:criteriaId`
Updates acceptance criteria completion status.

**Request Body:**
```json
{
  "completed": true
}
```

#### PUT `/tasks/:id/technical-implementation/:implementationId`
Updates technical implementation completion status.

**Request Body:**
```json
{
  "completed": true
}
```

## Data Storage

### File Location
Task data is stored in `backend/data/taskmaster.json`

### Data Structure
```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Fix Port Configuration Issues",
      "description": "Resolve port conflicts between frontend and backend services",
      "priority": "P0",
      "status": "not-started",
      "category": "devops",
      "estimatedHours": 2,
      "actualHours": 0,
      "complexity": 2,
      "dependencies": [],
      "acceptanceCriteria": [
        {
          "id": "AC-001-1",
          "description": "Frontend consistently runs on port 3000",
          "completed": false
        }
      ],
      "technicalImplementation": [
        {
          "id": "TI-001-1",
          "description": "Update Vite configuration for frontend port",
          "completed": false
        }
      ],
      "createdAt": "2025-05-26T23:01:00.000Z",
      "updatedAt": "2025-05-26T23:01:00.000Z"
    }
  ],
  "metadata": {
    "projectName": "Room of Requirements",
    "version": "1.0.0",
    "lastUpdated": "2025-05-26T23:01:00.000Z",
    "totalTasks": 1,
    "completedTasks": 0
  }
}
```

## Frontend Integration

### TaskService Updates
The `TaskService` class has been updated to use async methods that fetch data from the TaskMaster API:

```typescript
class TaskService implements ITaskService {
  private baseUrl = 'http://localhost:3001/api/v1/taskmaster';

  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`);
      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      console.error('Error fetching tasks from TaskMaster API:', error);
      return this.getFallbackTasks();
    }
  }

  async getProjectProgress(): Promise<ProjectProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/progress`);
      return await response.json();
    } catch (error) {
      return await this.calculateProjectProgressLocally();
    }
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update task status: ${response.statusText}`);
    }
  }
}
```

### TaskMasterPage Updates
The dashboard component now:
- Fetches data on component mount using `useEffect`
- Handles loading and error states
- Provides real-time updates when tasks are modified
- Automatically refreshes data after status changes

```typescript
const TaskMasterPage: React.FC = () => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, progressData, recommendationData] = await Promise.all([
          taskService.getAllTasks(),
          taskService.getProjectProgress(),
          taskService.getNextTaskRecommendation()
        ]);
        
        setAllTasks(tasksData);
        setProjectProgress(progressData);
        setNextRecommendation(recommendationData);
      } catch (err) {
        setError('Failed to load TaskMaster data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
};
```

## Error Handling & Fallbacks

### Graceful Degradation
- If the TaskMaster API is unavailable, the service falls back to local calculations
- Fallback data is provided to ensure the dashboard remains functional
- Error messages are displayed to users when data cannot be loaded

### Retry Logic
- Failed API calls are logged with detailed error messages
- The system attempts to use fallback methods when primary endpoints fail
- Users are notified of connection issues with actionable error messages

## Benefits

### Real-Time Data
- Dashboard always shows current task status
- Changes are immediately reflected across all views
- No risk of working with outdated information

### Persistence
- Task updates are saved to the backend
- Data survives browser refreshes and application restarts
- Consistent state across multiple sessions

### Scalability
- Backend can handle multiple concurrent users
- Data can be easily backed up and restored
- Integration with external systems is possible

### MCP Server Compatibility
- Data format matches MCP server expectations
- Easy integration with TaskMaster AI commands
- Consistent with TaskMaster methodology and best practices

## MCP Server Format Integration

The system now supports the MCP server output format for task management:

```
✅ Called MCP tool: get_tasks
You currently have 1 top-level task with 0 subtasks...

Completed Tasks (0/1): 
(No completed tasks yet)

Pending Tasks (1/1):
📋 TASK-001: Fix Port Configuration Issues (P0, 2h) - 0% complete
   └── 4 acceptance criteria, 4 technical implementation steps

Progress Summary:
• Overall completion: 0% (0/1 tasks completed)
• Estimated remaining: 2 hours
• Current sprint: Sprint 1 - Foundation & Core Algorithm
• Sprint 1 progress: 0% (0/1 tasks) - High importance
```

## Future Enhancements

### Planned Features
- WebSocket integration for real-time updates
- Task history and audit trail
- Advanced filtering and search capabilities
- Export functionality for project reports
- Integration with external project management tools

### MCP Server Extensions
- Direct integration with TaskMaster AI chat commands
- Automated task generation from PRD analysis
- AI-powered task prioritization and scheduling
- Intelligent dependency detection and management

## Testing

### API Testing
```bash
# Test task retrieval
curl http://localhost:3001/api/v1/taskmaster/tasks

# Test progress endpoint
curl http://localhost:3001/api/v1/taskmaster/progress

# Test task status update
curl -X PUT http://localhost:3001/api/v1/taskmaster/tasks/TASK-001/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'
```

### Frontend Testing
1. Navigate to `/taskmaster` in the application
2. Verify data loads correctly
3. Test task expansion and interaction
4. Verify error handling when backend is unavailable

## Conclusion

The TaskMaster MCP server integration provides a robust, scalable foundation for task management that ensures data accuracy and enables real-time collaboration. The system maintains backward compatibility while providing significant improvements in functionality and reliability. 