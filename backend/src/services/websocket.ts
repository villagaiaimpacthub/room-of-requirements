import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import OpenRouterService from './openrouter';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  useCase?: 'general' | 'research' | 'quick';
}

interface ConversationSession {
  id: string;
  messages: ChatMessage[];
  stage: 'concept' | 'requirements' | 'prd' | 'tasks';
  projectName?: string;
  userId?: string;
}

class WebSocketService {
  private io: SocketIOServer;
  private openRouterService: OpenRouterService;
  private conversations: Map<string, ConversationSession> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.openRouterService = new OpenRouterService();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join or create a conversation session
      socket.on('join-conversation', (sessionId: string) => {
        socket.join(sessionId);
        
        if (!this.conversations.has(sessionId)) {
          this.conversations.set(sessionId, {
            id: sessionId,
            messages: [],
            stage: 'concept'
          });
        }

        const session = this.conversations.get(sessionId)!;
        socket.emit('conversation-history', session.messages);
        console.log(`Client ${socket.id} joined conversation ${sessionId}`);
      });

      // Handle new messages
      socket.on('send-message', async (data: { 
        sessionId: string; 
        message: string; 
        stage?: 'concept' | 'requirements' | 'prd' | 'tasks';
        useCase?: 'general' | 'research' | 'quick';
      }) => {
        try {
          await this.handleMessage(socket, data);
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('error', { 
            message: 'Failed to process message', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      });

      // Handle conversation stage changes
      socket.on('change-stage', (data: { sessionId: string; stage: 'concept' | 'requirements' | 'prd' | 'tasks' }) => {
        const session = this.conversations.get(data.sessionId);
        if (session) {
          session.stage = data.stage;
          this.io.to(data.sessionId).emit('stage-changed', data.stage);
        }
      });

      // Handle typing indicators
      socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
        socket.to(data.sessionId).emit('user-typing', { 
          userId: socket.id, 
          isTyping: data.isTyping 
        });
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private async handleMessage(socket: any, data: { 
    sessionId: string; 
    message: string; 
    stage?: string;
    useCase?: 'general' | 'research' | 'quick';
  }) {
    const session = this.conversations.get(data.sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    // Update stage if provided
    if (data.stage) {
      session.stage = data.stage as 'concept' | 'requirements' | 'prd' | 'tasks';
    }

    // Add user message to conversation
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: data.message,
      timestamp: new Date(),
      useCase: data.useCase || 'general'
    };

    session.messages.push(userMessage);

    // Broadcast user message to all clients in the session
    this.io.to(data.sessionId).emit('message', userMessage);

    // Indicate AI is typing
    this.io.to(data.sessionId).emit('ai-typing', true);

    try {
      // Prepare messages for OpenRouter
      const systemPrompt = this.openRouterService.getSystemPrompt(session.stage);
      const conversationHistory = session.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      // Add system prompt at the beginning
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory
      ];

      console.log(`Processing message for session ${data.sessionId}:`, data.message);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        model: data.useCase === 'research' ? 'Gemini Pro' : 
               data.useCase === 'quick' ? 'Gemini Flash' : 
               'Claude 3 Sonnet',
        useCase: data.useCase || 'general'
      };

      // Try streaming first, fallback to regular response if it fails
      let messageStartEmitted = false;
      
      try {
        const stream = await this.openRouterService.sendStreamingMessage(
          messages,
          data.useCase || 'general'
        );
        
        // Start streaming response
        this.io.to(data.sessionId).emit('ai-typing', false);
        this.io.to(data.sessionId).emit('message-start', assistantMessage);
        messageStartEmitted = true;

        console.log('Starting streaming response...');

        // Process streaming chunks
        if (stream && typeof stream.getReader === 'function') {
          const reader = stream.getReader();
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim());

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const jsonData = line.slice(6);
                  if (jsonData === '[DONE]') break;

                  try {
                    const parsed = JSON.parse(jsonData);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      assistantMessage.content += content;
                      this.io.to(data.sessionId).emit('message-chunk', {
                        id: assistantMessage.id,
                        content: content
                      });
                    }
                  } catch (parseError) {
                    console.log('Skipping invalid JSON chunk:', jsonData);
                    continue;
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          console.log('Streaming completed, final content length:', assistantMessage.content.length);
        } else {
          throw new Error('Stream not available, falling back to regular response');
        }

      } catch (streamError) {
        console.log('Streaming failed, falling back to regular response:', streamError);
        
        // Reset the assistant message to avoid duplicate content
        assistantMessage.content = '';
        
        // Fallback to non-streaming response
        const response = await this.openRouterService.sendMessage(
          messages,
          data.useCase || 'general',
          false
        );

        if (response && response.choices && response.choices[0]) {
          assistantMessage.content = response.choices[0].message.content;
          console.log('Got non-streaming response:', assistantMessage.content.substring(0, 100) + '...');
          
          // Only emit message-start if we haven't already
          this.io.to(data.sessionId).emit('ai-typing', false);
          if (!messageStartEmitted) {
            this.io.to(data.sessionId).emit('message-start', assistantMessage);
          }
        } else {
          throw new Error('Invalid response format from OpenRouter');
        }
      }

      // Finalize message
      session.messages.push(assistantMessage);
      this.io.to(data.sessionId).emit('message-complete', assistantMessage);

      console.log(`Message completed for session ${data.sessionId}`);

    } catch (error) {
      console.error('Error processing AI response:', error);
      this.io.to(data.sessionId).emit('ai-typing', false);
      this.io.to(data.sessionId).emit('error', { 
        message: 'Failed to get AI response', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  // Get conversation history
  getConversation(sessionId: string): ConversationSession | undefined {
    return this.conversations.get(sessionId);
  }

  // Export conversation data
  exportConversation(sessionId: string): ConversationSession | null {
    const session = this.conversations.get(sessionId);
    return session ? { ...session } : null;
  }

  // Clear old conversations (cleanup utility)
  cleanupOldConversations(maxAgeHours = 24) {
    const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.conversations.entries()) {
      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage && lastMessage.timestamp.getTime() < maxAge) {
        this.conversations.delete(sessionId);
        console.log(`Cleaned up old conversation: ${sessionId}`);
      }
    }
  }
}

export default WebSocketService; 