import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { join } from 'path';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import WebSocketService from './services/websocket';
import OpenRouterService from './services/openrouter';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Create HTTP server for WebSocket integration
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize WebSocket service
const webSocketService = new WebSocketService(server);

// Initialize OpenRouter service for non-streaming endpoints
let openRouterService: OpenRouterService;
try {
  openRouterService = new OpenRouterService();
  console.log('✅ OpenRouter service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize OpenRouter service:', error);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Room of Requirements Backend',
    version: '1.0.0',
    features: {
      webSocket: 'enabled',
      openRouter: openRouterService ? 'connected' : 'error',
      ai: 'claude-3.5-sonnet'
    }
  });
});

// Test endpoint
app.get('/api/v1/test', (_req, res) => {
  res.json({ 
    message: 'Room of Requirements API is working!',
    timestamp: new Date().toISOString(),
    ai: openRouterService ? 'connected' : 'disconnected'
  });
});

// Chat endpoints for REST API (non-streaming)
app.post('/api/v1/chat/message', async (req, res) => {
  try {
    if (!openRouterService) {
      return res.status(500).json({ error: 'OpenRouter service not available' });
    }

    const { message, stage = 'concept', useCase = 'general' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = openRouterService.getSystemPrompt(stage);
    const messages = openRouterService.formatConversation(message, systemPrompt);
    
    const response = await openRouterService.sendMessage(messages, useCase);
    
    if (typeof response === 'object' && 'choices' in response) {
      res.json({
        message: response.choices[0]?.message?.content || 'No response',
        usage: response.usage,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ error: 'Unexpected response format' });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export conversation endpoint
app.get('/api/v1/conversations/:sessionId/export', (req, res) => {
  try {
    const { sessionId } = req.params;
    const conversation = webSocketService.exportConversation(sessionId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Export conversation error:', error);
    res.status(500).json({ error: 'Failed to export conversation' });
  }
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

// Start server with WebSocket support
server.listen(PORT, () => {
  console.log(`🚀 Room of Requirements Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Test API: http://localhost:${PORT}/api/v1/test`);
  console.log(`🔗 Tasks API: http://localhost:${PORT}/api/v1/tasks`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/v1/chat/message`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🤖 AI Model: ${openRouterService ? 'Claude 3.5 Sonnet (OpenRouter)' : 'Not available'}`);
});

export default app; 