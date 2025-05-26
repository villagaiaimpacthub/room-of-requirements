import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { join } from 'path';
import { readFileSync, mkdirSync } from 'fs';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import WebSocketService from './services/websocket';
import OpenRouterService from './services/openrouter';
import CompostingService from './services/compostingService';

// Load environment variables
dotenv.config();

// Temporary fix: Set OpenRouter API key if not found in environment
if (!process.env.OPENROUTER_API_KEY) {
  console.log('⚠️ Setting OpenRouter API key from fallback');
  process.env.OPENROUTER_API_KEY = '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';
}

const app = express();
const PORT = process.env.PORT || 3001;

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

// Initialize Composting service
const compostingService = new CompostingService();

// Configure multer for file uploads
const uploadDir = join(__dirname, '../uploads');
try {
  mkdirSync(uploadDir, { recursive: true });
} catch (error) {
  console.log('Upload directory already exists or created');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/x-markdown',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    // Check file extension for markdown files (browsers sometimes send wrong MIME type)
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md', '.markdown', '.jpg', '.jpeg', '.png', '.gif'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype} (${file.originalname})`));
    }
  }
});

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

// Composting API endpoints

// Create new composting session
app.post('/api/v1/compost/session', (req, res) => {
  try {
    const { projectName } = req.body;
    const session = compostingService.createSession(projectName);
    
    res.json({
      success: true,
      session: {
        id: session.id,
        projectName: session.projectName,
        status: session.status,
        progress: session.progress
      }
    });
  } catch (error) {
    console.error('Error creating composting session:', error);
    res.status(500).json({ 
      error: 'Failed to create composting session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get composting session
app.get('/api/v1/compost/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = compostingService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error getting composting session:', error);
    res.status(500).json({ 
      error: 'Failed to get composting session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Upload files for composting
app.post('/api/v1/compost/session/:sessionId/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const session = compostingService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Set up WebSocket progress updates
    const progressCallback = (progress: any) => {
      webSocketService.broadcastToSession(sessionId, 'composting-progress', progress);
    };
    
    // Process files
    const filePaths = files.map(file => file.path);
    const fileNames = files.map(file => file.originalname);
    const mimeTypes = files.map(file => file.mimetype);
    
    const processedFiles = await compostingService.processFiles(
      sessionId,
      filePaths,
      fileNames,
      mimeTypes,
      progressCallback
    );
    
    res.json({
      success: true,
      message: `Successfully processed ${processedFiles.length} files`,
      files: processedFiles.map(file => ({
        id: file.id,
        originalName: file.originalName,
        size: file.size,
        wordCount: file.metadata.wordCount
      }))
    });
    
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ 
      error: 'Failed to upload files',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update project description
app.post('/api/v1/compost/session/:sessionId/description', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    const session = compostingService.updateProjectDescription(sessionId, description);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error updating project description:', error);
    res.status(500).json({ 
      error: 'Failed to update project description',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Extract components
app.post('/api/v1/compost/session/:sessionId/extract', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = compostingService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Set up WebSocket progress updates
    const progressCallback = (progress: any) => {
      webSocketService.broadcastToSession(sessionId, 'composting-progress', progress);
    };
    
    const components = await compostingService.extractComponents(sessionId, progressCallback);
    
    res.json({
      success: true,
      message: `Successfully extracted ${components.length} components`,
      components: components.map(comp => ({
        id: comp.id,
        title: comp.title,
        type: comp.type,
        tags: comp.tags,
        reusabilityScore: comp.reusabilityScore,
        dependencies: comp.dependencies
      }))
    });
    
  } catch (error) {
    console.error('Error extracting components:', error);
    res.status(500).json({ 
      error: 'Failed to extract components',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete composting session
app.post('/api/v1/compost/session/:sessionId/complete', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = compostingService.completeSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error completing composting session:', error);
    res.status(500).json({ 
      error: 'Failed to complete composting session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all composting sessions (for admin dashboard)
app.get('/api/v1/compost/sessions', (req, res) => {
  try {
    const sessions = compostingService.getAllSessions();
    const sessionStats = sessions.map(session => compostingService.getSessionStats(session.id));
    
    res.json({
      success: true,
      sessions: sessionStats,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status !== 'completed').length
    });
  } catch (error) {
    console.error('Error getting composting sessions:', error);
    res.status(500).json({ 
      error: 'Failed to get composting sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
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