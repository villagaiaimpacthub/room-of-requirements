import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  MessageCircle, 
  Loader2, 
  Sparkles,
  Copy,
  Check,
  Wand2,
  User,
  Bot,
  BarChart3
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  model?: string;
  useCase?: 'general' | 'research' | 'quick';
  isStageTransition?: boolean;
}

interface ChatInterfaceProps {
  className?: string;
  onEnterRoom?: (messages: Message[]) => void;
  onEnterCompost?: () => void;
  existingMessages?: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className = '', 
  onEnterRoom,
  onEnterCompost,
  existingMessages = []
}) => {
  const [messages, setMessages] = useState<Message[]>(existingMessages);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<'concept' | 'description' | 'requirements' | 'prd' | 'tasks'>('concept');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Initialize WebSocket connection
  useEffect(() => {
    console.log('🔌 Connecting to WebSocket at http://localhost:3001');
    console.log('🔍 Current connection state:', isConnected);
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
      socket.emit('join-conversation', sessionId);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });

    socket.on('conversation-history', (history: Message[]) => {
      console.log('📜 Received conversation history:', history.length, 'messages');
      setMessages(history);
    });

    socket.on('message', (message: Message) => {
      console.log('📨 Received message:', message);
      setMessages(prev => {
        console.log('📝 Current messages count:', prev.length);
        const newMessages = [...prev, message];
        console.log('📝 New messages count:', newMessages.length);
        return newMessages;
      });
    });

    socket.on('message-start', (message: Message) => {
      console.log('🚀 Message streaming started:', message.id);
      setMessages(prev => [...prev, { ...message, isStreaming: true }]);
      setAiTyping(false);
    });

    socket.on('message-chunk', (data: { id: string; content: string }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.id 
          ? { ...msg, content: msg.content + data.content }
          : msg
      ));
    });

    socket.on('message-complete', (message: Message) => {
      console.log('✅ Message streaming completed:', message.id);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...message, isStreaming: false }
          : msg
      ));
    });

    socket.on('ai-typing', (typing: boolean) => {
      console.log('⌨️ AI typing status:', typing);
      setAiTyping(typing);
    });

    socket.on('stage-changed', (data: { stage: string; message?: string }) => {
      console.log('🎯 Stage changed:', data);
      setCurrentStage(data.stage as 'concept' | 'description' | 'requirements' | 'prd' | 'tasks');
      
      if (data.message) {
        const stageMessage: Message = {
          id: uuidv4(),
          role: 'system',
          content: `✨ ${data.message}`,
          timestamp: new Date(),
          isStageTransition: true
        };
        setMessages(prev => [...prev, stageMessage]);
      }
    });

    socket.on('auto-enter-room', (data: { message: string; conversationHistory?: Message[] }) => {
      console.log('🚪 Auto entering room:', data);
      
      // Show the transition message
      const transitionMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `✨ ${data.message}`,
        timestamp: new Date(),
        isStageTransition: true
      };
      setMessages(prev => [...prev, transitionMessage]);
      
      // Automatically trigger room entry after a short delay
      setTimeout(() => {
        if (onEnterRoom) {
          console.log('🚪 Automatically entering the room...');
          // Use the conversation history from the server if available, otherwise use current messages
          const conversationToPass = data.conversationHistory || messages;
          onEnterRoom(conversationToPass);
        }
      }, 1500); // 1.5 second delay to show the transition message
    });

    socket.on('navigate-to-marketplace', (data: { searchQuery: string; message: string }) => {
      console.log('🛒 Navigating to marketplace:', data);
      
      // Show the transition message
      const transitionMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `🛒 ${data.message}`,
        timestamp: new Date(),
        isStageTransition: true
      };
      setMessages(prev => [...prev, transitionMessage]);
      
      // Navigate to marketplace with search query after a short delay
      setTimeout(() => {
        const searchParams = new URLSearchParams({
          chatSearch: data.searchQuery
        });
        window.location.href = `/marketplace?${searchParams.toString()}`;
      }, 1500);
    });

    socket.on('error', (error: { message: string; error?: string }) => {
      console.error('❌ Chat error:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setAiTyping(false);
    });

    return () => {
      console.log('🔌 Disconnecting WebSocket');
      socket.disconnect();
    };
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!socketRef.current || !isConnected) return;
    
    setIsTyping(true);
    socketRef.current.emit('typing', { sessionId, isTyping: true });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current) {
        socketRef.current.emit('typing', { sessionId, isTyping: false });
      }
    }, 1000);
  }, [sessionId, isConnected]);

  // Send message
  const sendMessage = useCallback(() => {
    console.log('📤 Send message called');
    console.log('🔍 Send message state:', { 
      hasInput: !!inputValue.trim(), 
      inputValue: inputValue.trim(),
      hasSocket: !!socketRef.current, 
      isConnected 
    });
    
    if (!inputValue.trim() || !socketRef.current || !isConnected) {
      console.log('❌ Cannot send message:', { 
        hasInput: !!inputValue.trim(), 
        hasSocket: !!socketRef.current, 
        isConnected 
      });
      return;
    }

    console.log('📤 Sending message:', inputValue.trim());
    
    socketRef.current.emit('send-message', {
      sessionId,
      message: inputValue.trim(),
      stage: currentStage,
      useCase: 'general'
    });

    setInputValue('');
    setIsTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit('typing', { sessionId, isTyping: false });
    }

    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputValue, sessionId, isConnected]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    handleTyping();
    autoResizeTextarea(e.target);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Copy message content
  const copyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // Auto-resize textarea
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    console.log('🎯 Suggestion clicked:', suggestion);
    console.log('🔍 Connection state:', { 
      hasSocket: !!socketRef.current, 
      isConnected,
      hasCompostHandler: !!onEnterCompost 
    });
    
    // Special handling for composting - navigate to composting dashboard
    if (suggestion === "Compost a project" && onEnterCompost) {
      console.log('🌱 Navigating to composting dashboard');
      onEnterCompost();
      return;
    }

    // Special handling for finding existing components - start chat-based marketplace flow
    if (suggestion === "Find an existing component") {
      console.log('🔍 Starting marketplace search flow');
      
      if (!socketRef.current || !isConnected) {
        console.log('❌ Cannot start marketplace flow - no connection');
        return;
      }

      // Send initial marketplace inquiry message
      socketRef.current.emit('send-message', {
        sessionId,
        message: "Find an existing component",
        stage: currentStage,
        useCase: 'general'
      });

      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socketRef.current.emit('typing', { sessionId, isTyping: false });
      }

      // Focus back to input for user to describe what they're looking for
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }

    if (!socketRef.current || !isConnected) {
      console.log('❌ Cannot send suggestion:', { 
        hasSocket: !!socketRef.current, 
        isConnected 
      });
      return;
    }

    console.log('📤 Sending suggestion message:', suggestion);
    
    socketRef.current.emit('send-message', {
      sessionId,
      message: suggestion,
      stage: currentStage,
      useCase: 'general'
    });

    setIsTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit('typing', { sessionId, isTyping: false });
    }

    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-900 ${className}`}>
      {/* Header - Clean and minimal */}
      <div className="flex-shrink-0 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg magical-glow">
              <Wand2 className="w-5 h-5 text-amber-900" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Room of Requirements</h1>
              <p className="text-xs text-gray-400">Where ideas become reality</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* TaskMaster Button - Integrated with header */}
            <button
              onClick={() => navigate('/taskmaster')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 hover:border-blue-400/50 rounded-lg transition-all duration-200 text-blue-300 hover:text-blue-200 text-sm font-medium"
              title="Open TaskMaster AI Dashboard"
            >
              <BarChart3 className="w-4 h-4" />
              <span>TaskMaster</span>
            </button>
            
            {/* Stage Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 rounded-lg border border-amber-600/30">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm text-amber-200 capitalize">
                {currentStage === 'description' ? 'Detailed Description' : currentStage}
              </span>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container - Fixed height with proper spacing */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
              {/* Welcome Section */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3">
                  <Sparkles className="w-10 h-10 text-amber-900" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse delay-300"></div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Hello, magical being
                </h2>
                <p className="text-gray-400 max-w-2xl text-lg">
                  How can I help you today?
                </p>
              </div>
              
              {/* Suggestion Cards - OpenWebUI style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                {[
                  { text: "Build out a new idea", desc: "Transform your concept into reality" },
                  { text: "Find an existing component", desc: "Discover reusable building blocks" }, 
                  { text: "Compost a project", desc: "Gracefully retire and extract value" },
                  { text: "I trust the universe", desc: "Let magic guide your next adventure" }
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="group p-4 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white text-sm rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full group-hover:bg-yellow-400 transition-colors mt-1.5 flex-shrink-0"></div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{suggestion.text}</span>
                        <span className="text-xs text-gray-500 group-hover:text-gray-400">{suggestion.desc}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-32">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`group flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-animate`}
                >
                  {/* Assistant Avatar - Left side */}
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className={`max-w-[75%] ${message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                    {/* Message Header */}
                    <div className={`flex items-center gap-2 mb-0.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs font-medium ${
                        message.role === 'user' ? 'text-amber-400' : 'text-amber-400'
                      }`}>
                        {message.role === 'user' ? 'You' : 'Claude'}
                      </span>
                      {message.isStreaming && (
                        <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`rounded-xl px-2 py-0.5 ${
                      message.role === 'user'
                        ? 'bg-gray-800/80 text-gray-100 border border-gray-700/30'
                        : message.role === 'system'
                        ? message.isStageTransition 
                          ? 'bg-amber-900/40 text-amber-200 border border-amber-600/40'
                          : 'bg-red-900/40 text-red-200 border border-red-600/40'
                        : 'bg-gray-800/80 text-gray-100 border border-gray-700/30'
                    }`}>
                      <div className="prose prose-invert max-w-none prose-xs leading-tight">
                        <ReactMarkdown
                          components={{
                            code({ node, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !node?.data || !match;
                              return !isInline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus as any}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-lg !mt-2 !mb-2"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-gray-700/60 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    
                    {/* Message Footer */}
                    <div className={`flex items-center gap-2 mt-0.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => copyMessage(message)}
                        className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* User Avatar - Right side */}
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-amber-900" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* AI Typing Indicator */}
              {aiTyping && (
                <div className="flex gap-2 message-animate">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex flex-col items-start">
                                          <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-amber-400">Claude</span>
                    </div>
                    <div className="bg-gray-800/80 rounded-xl px-2 py-0.5 border border-gray-700/30">
                      <div className="flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                        <span className="text-sm text-amber-300">thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom with proper spacing */}
      <div className="flex-shrink-0 border-t border-gray-700/50 bg-gray-800/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-gray-800/60 rounded-2xl border border-gray-700/40 focus-within:border-amber-500/40 focus-within:bg-gray-800/80 transition-all duration-200">
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1 flex items-center">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    currentStage === 'concept' ? "What do you want to build?" :
                    currentStage === 'description' ? "Describe your project in detail..." :
                    currentStage === 'requirements' ? "What features do you need?" :
                    currentStage === 'prd' ? "Let's create your PRD..." :
                    "Send a message"
                  }
                  className="w-full bg-transparent text-gray-100 resize-none border-none outline-none placeholder-gray-500 text-sm leading-tight min-h-[1.5rem] max-h-[8rem] focus:placeholder-gray-400 overflow-hidden font-normal"
                  rows={1}
                  disabled={!isConnected}
                  style={{ lineHeight: '1.5rem', paddingTop: '0', paddingBottom: '0' }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || !isConnected}
                className="w-9 h-9 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-600 disabled:text-gray-400 text-amber-900 hover:text-amber-800 rounded-full transition-all duration-200 flex items-center justify-center flex-shrink-0 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-amber-500/25"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Enter Room Button - Show when there's meaningful content */}
      {messages.length >= 3 && onEnterRoom && (
        <div className="fixed bottom-28 right-8 z-50">
          <button
            onClick={() => onEnterRoom(messages)}
            className="group relative px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-900 font-semibold rounded-full shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Enter the Room</span>
            <Wand2 className="w-4 h-4" />
            
            {/* Magical glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
            
            {/* Subtle pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 opacity-20 animate-ping"></div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 