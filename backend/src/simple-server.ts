import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { join } from 'path';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'TaskMaster Backend',
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/api/v1/test', (_req, res) => {
  res.json({ 
    message: 'TaskMaster API is working!',
    timestamp: new Date().toISOString()
  });
});

// Tasks endpoint
app.get('/api/v1/tasks', (_req, res) => {
  try {
    const tasksPath = join(__dirname, '../../tasks/tasks.json');
    console.log('Looking for tasks at:', tasksPath);
    
    const tasksData = readFileSync(tasksPath, 'utf8');
    const tasks = JSON.parse(tasksData);
    
    // Calculate progress for each task
    const tasksWithProgress = tasks.tasks.map((task: any) => ({
      ...task,
      progress: task.subtasks ? 
        Math.round((task.subtasks.filter((st: any) => st.status === 'done').length / task.subtasks.length) * 100) : 
        (task.status === 'done' ? 100 : 0)
    }));
    
    res.json({ 
      tasks: tasksWithProgress,
      totalTasks: tasks.tasks.length,
      completedTasks: tasks.tasks.filter((t: any) => t.status === 'done').length,
      totalSubtasks: tasks.tasks.reduce((sum: number, task: any) => sum + (task.subtasks?.length || 0), 0)
    });
  } catch (error) {
    console.error('Error reading tasks file:', error);
    res.status(500).json({ 
      error: 'Failed to load tasks',
      message: 'Tasks file not found. Please generate tasks using TaskMaster AI first.'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TaskMaster Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Test API: http://localhost:${PORT}/api/v1/test`);
  console.log(`🔗 Tasks API: http://localhost:${PORT}/api/v1/tasks`);
});

export default app; 