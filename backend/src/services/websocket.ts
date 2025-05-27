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
  stage: 'concept' | 'description' | 'requirements' | 'prd' | 'tasks';
  projectName?: string;
  userId?: string;
  conceptUnderstood?: boolean; // Track when we understand what they want to build
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
        stage?: 'concept' | 'description' | 'requirements' | 'prd' | 'tasks';
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
      socket.on('change-stage', (data: { sessionId: string; stage: 'concept' | 'description' | 'requirements' | 'prd' | 'tasks' }) => {
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
      session.stage = data.stage as 'concept' | 'description' | 'requirements' | 'prd' | 'tasks';
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

      // Check if we should transition from concept to description stage
      await this.checkStageTransition(session, data.sessionId);

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

  // Check if we should transition between stages based on conversation content
  private async checkStageTransition(session: ConversationSession, sessionId: string) {
    // Get the last user message to check for room entry request
    const lastUserMessage = session.messages
      .filter(msg => msg.role === 'user')
      .pop();

    // Check if user wants to enter the room (from any stage if they have enough content)
    if (lastUserMessage) {
      const userContent = lastUserMessage.content.toLowerCase();
      const roomEntryPhrases = [
        'yes lets enter the room',
        'yes let\'s enter the room',
        'enter the room',
        'lets enter the room',
        'let\'s enter the room',
        'lets go to the room',
        'let\'s go to the room',
        'go to the room',
        'yes enter the room',
        'room of requirements',
        'go to room',
        'enter room',
        'take me to the room',
        'bring me to the room',
        'i want to go to the room',
        'can we go to the room',
        'ready for the room',
        'time for the room'
      ];

      const shouldEnterRoom = roomEntryPhrases.some(phrase => 
        userContent.includes(phrase)
      );

      // Allow room entry if they have enough conversation content (3+ messages) regardless of stage
      if (shouldEnterRoom && session.messages.length >= 3) {
        // Trigger automatic room entry with full conversation context
        this.io.to(sessionId).emit('auto-enter-room', {
          message: 'Automatically entering the Room to create your PRD...',
          conversationHistory: session.messages // Include full chat history
        });
        
        console.log(`🚪 Session ${sessionId} automatically entering the room with ${session.messages.length} messages`);
        return;
      }
    }

    // Check if user wants to find existing components and navigate to marketplace
    if (lastUserMessage) {
      const userContent = lastUserMessage.content.toLowerCase();
      
      // Check if the conversation is about finding components
      const marketplaceKeywords = [
        'find an existing component',
        'find existing component',
        'looking for component',
        'search for component',
        'existing solution',
        'reusable component',
        'marketplace'
      ];

      const isMarketplaceInquiry = marketplaceKeywords.some(keyword => 
        userContent.includes(keyword)
      );

      // If this is a marketplace inquiry, store context but DON'T auto-navigate
      // Preserve the magical Room of Requirements button experience
      if (isMarketplaceInquiry) {
        console.log(`💬 Component inquiry detected for session ${sessionId}, preserving Room of Requirements button flow`);
        
        // Store the search context for when user manually navigates via Room button
        // The full conversation context will be used for intelligent marketplace search
        // This preserves the magical experience where users choose when to "enter the room"
        return;
      }

      // Also check if user has provided specific component details in any recent message
      const recentUserMessages = session.messages
        .filter(msg => msg.role === 'user')
        .slice(-3); // Get last 3 user messages

      const hasComponentDetails = recentUserMessages.some(msg => {
        const content = msg.content.toLowerCase();
        return content.includes('ui') || content.includes('form') || content.includes('component') ||
               content.includes('builder') || content.includes('tool') || content.includes('widget') ||
               content.includes('payment') || content.includes('chart') || content.includes('table') ||
               content.includes('modal') || content.includes('navigation') || content.includes('auth');
      });

      // If we detect component details, store context but preserve Room button flow
      if (hasComponentDetails && session.messages.length >= 3) {
        console.log(`🔍 Component details detected for session ${sessionId}, context ready for Room navigation`);
        // Context will be used when user manually clicks "Enter Room" button
      }
    }

    // Check for comprehensive content that suggests readiness for PRD creation
    const userMessages = session.messages.filter(msg => msg.role === 'user');
    const hasComprehensiveContent = userMessages.some(msg => {
      const content = msg.content.toLowerCase();
      const contentLength = msg.content.length;
      
      // Check for PRD-like content or comprehensive descriptions
      const prdIndicators = [
        'product requirements document',
        'prd',
        'technical requirements',
        'user stories',
        'acceptance criteria',
        'functional requirements',
        'non-functional requirements',
        'system architecture',
        'api endpoints',
        'database schema',
        'authentication',
        'user interface',
        'technical stack'
      ];
      
      const hasPrdIndicators = prdIndicators.some(indicator => content.includes(indicator));
      const isLongContent = contentLength > 1000; // Long detailed description
      
      return hasPrdIndicators || isLongContent;
    });

    // If user has provided comprehensive content, suggest room entry
    if (hasComprehensiveContent && session.messages.length >= 3) {
      const lastAssistantMessage = session.messages
        .filter(msg => msg.role === 'assistant')
        .pop();
      
      if (lastAssistantMessage) {
        const assistantContent = lastAssistantMessage.content.toLowerCase();
        
        // Check if AI hasn't already suggested room entry
        const hasRoomSuggestion = assistantContent.includes('room of requirements') || 
                                 assistantContent.includes('enter the room') ||
                                 assistantContent.includes('go to the room');
        
        if (!hasRoomSuggestion) {
          // Suggest room entry in next AI response
          console.log(`💡 Session ${sessionId} has comprehensive content, ready for room entry`);
        }
      }
    }

    // Only check concept to description transitions for concept stage
    if (session.stage !== 'concept') return;

    // Look for keywords that indicate the AI understands what they want to build
    const lastAssistantMessage = session.messages
      .filter(msg => msg.role === 'assistant')
      .pop();

    if (!lastAssistantMessage) return;

    const content = lastAssistantMessage.content.toLowerCase();
    
    // Check if the AI is asking for detailed description (indicating concept is understood)
    const descriptionPrompts = [
      'let\'s create the best possible description',
      'now let\'s create a comprehensive description',
      'i need you to be very specific about what we\'re building',
      'please describe in detail',
      'the more detailed you are',
      'be very specific about',
      'comprehensive description'
    ];

    const shouldTransition = descriptionPrompts.some(prompt => 
      content.includes(prompt)
    );

    if (shouldTransition && !session.conceptUnderstood) {
      session.conceptUnderstood = true;
      session.stage = 'description';
      
      // Notify clients about stage change
      this.io.to(sessionId).emit('stage-changed', {
        stage: 'description',
        message: 'Moving to detailed description phase'
      });
      
      console.log(`🎯 Session ${sessionId} transitioned to description stage`);
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

  // Broadcast message to specific session (for composting progress updates)
  broadcastToSession(sessionId: string, event: string, data: any) {
    this.io.to(sessionId).emit(event, data);
    console.log(`Broadcasted ${event} to session ${sessionId}`);
  }
}

export default WebSocketService; 