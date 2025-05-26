import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';
import { 
  Sparkles, 
  Wand2, 
  BookOpen, 
  FileText, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  Copy,
  Check,
  Bot
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  useCase?: 'general' | 'research' | 'quick';
  isStreaming?: boolean;
}

interface RoomDashboardProps {
  messages: Message[];
  onBackToChat: () => void;
  className?: string;
}

type RoomPhase = 'summary' | 'prd-generation' | 'prd-complete';

const RoomDashboard: React.FC<RoomDashboardProps> = ({ 
  messages, 
  onBackToChat, 
  className = '' 
}) => {
  const [currentPhase, setCurrentPhase] = useState<RoomPhase>('summary');
  const [conversationSummary, setConversationSummary] = useState<string>('');
  const [prdContent, setPrdContent] = useState<string>('');
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [copiedContent, setCopiedContent] = useState<string | null>(null);
  const [socketRef, setSocketRef] = useState<Socket | null>(null);
  const [prdProgress, setPrdProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(60);

  // Initialize WebSocket connection for PRD generation
  useEffect(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    setSocketRef(socket);

    socket.on('connect', () => {
      console.log('✅ Room WebSocket connected');
      socket.emit('join-conversation', sessionId);
    });

    socket.on('message-start', (message: Message) => {
      console.log('🚀 PRD generation started:', message.id);
      setPrdContent('');
    });

    socket.on('message-chunk', (data: { id: string; content: string }) => {
      setPrdContent(prev => prev + data.content);
    });

    socket.on('message-complete', (message: Message) => {
      console.log('✅ PRD generation completed');
      setPrdContent(message.content);
      setIsGeneratingPRD(false);
      setPrdProgress(100);
      setEstimatedTimeRemaining(0);
      setCurrentPhase('prd-complete');
    });

    socket.on('error', (error: { message: string }) => {
      console.error('❌ PRD generation error:', error);
      setIsGeneratingPRD(false);
      setPrdProgress(0);
      setEstimatedTimeRemaining(0);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  // Generate conversation summary on mount
  useEffect(() => {
    if (messages.length > 0) {
      const summary = generateConversationSummary(messages);
      setConversationSummary(summary);
    }
  }, [messages]);

  // Generate markdown summary of the conversation
  const generateConversationSummary = (msgs: Message[]): string => {
    const userMessages = msgs.filter(m => m.role === 'user');
    const assistantMessages = msgs.filter(m => m.role === 'assistant');
    
    // Extract project title from first meaningful exchange
    const projectTitle = extractProjectTitle(userMessages);
    
    // Extract key details from the conversation
    const projectDescription = extractProjectDescription(msgs);
    const keyFeatures = extractKeyFeatures(msgs);
    const targetAudience = extractTargetAudience(msgs);
    const technicalRequirements = extractTechnicalRequirements(msgs);
    
    return `# ${projectTitle}

## Project Overview
${projectDescription}

## Target Audience
${targetAudience}

## Key Features
${keyFeatures}

## Technical Requirements
${technicalRequirements}

## Conversation Summary
- **Total Messages**: ${msgs.length}
- **User Messages**: ${userMessages.length}
- **Assistant Responses**: ${assistantMessages.length}
- **Last Activity**: ${new Date(msgs[msgs.length - 1]?.timestamp || new Date()).toLocaleString()}

---

*This summary was generated from your conversation and will be used to create a comprehensive Product Requirements Document (PRD).*`;
  };

  const extractProjectTitle = (userMessages: Message[]): string => {
    const firstMessage = userMessages[0]?.content || '';
    const secondMessage = userMessages[1]?.content || '';
    
    // Look for project-related keywords in early messages
    const combined = `${firstMessage} ${secondMessage}`.toLowerCase();
    
    if (combined.includes('marketplace')) return 'Marketplace Platform';
    if (combined.includes('ai assistant')) return 'AI Assistant Tool';
    if (combined.includes('tracking') || combined.includes('practice')) return 'Practice Tracking Application';
    if (combined.includes('app') || combined.includes('application')) return 'Mobile/Web Application';
    if (combined.includes('platform')) return 'Digital Platform';
    if (combined.includes('tool')) return 'Software Tool';
    
    // Fallback to first meaningful phrase
    const words = firstMessage.split(' ').slice(0, 4).join(' ');
    return words.length > 5 ? `${words} Project` : 'Your Project';
  };

  const extractProjectDescription = (msgs: Message[]): string => {
    const userMessages = msgs.filter(m => m.role === 'user');
    const assistantMessages = msgs.filter(m => m.role === 'assistant');
    
    // Look for the most detailed user description
    const detailedMessage = userMessages.find(m => m.content.length > 100);
    if (detailedMessage) {
      return detailedMessage.content.substring(0, 300) + (detailedMessage.content.length > 300 ? '...' : '');
    }
    
    // Fallback to assistant's understanding
    const assistantSummary = assistantMessages.find(m => 
      m.content.toLowerCase().includes('understand') || 
      m.content.toLowerCase().includes('sounds like')
    );
    
    if (assistantSummary) {
      return assistantSummary.content.substring(0, 300) + (assistantSummary.content.length > 300 ? '...' : '');
    }
    
    return 'A comprehensive solution designed to address specific user needs and provide valuable functionality.';
  };

  const extractKeyFeatures = (msgs: Message[]): string => {
    const userMessages = msgs.filter(m => m.role === 'user');
    const features: string[] = [];
    
    // Look for feature-related keywords
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      if (content.includes('feature') || content.includes('function') || content.includes('capability')) {
        // Extract sentences containing feature keywords
        const sentences = msg.content.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes('feature') || 
              sentence.toLowerCase().includes('function') || 
              sentence.toLowerCase().includes('should') ||
              sentence.toLowerCase().includes('will')) {
            features.push(`- ${sentence.trim()}`);
          }
        });
      }
    });
    
    if (features.length === 0) {
      return `- Core functionality as discussed in the conversation
- User-friendly interface
- Responsive design
- Data management capabilities`;
    }
    
    return features.slice(0, 8).join('\n');
  };

  const extractTargetAudience = (msgs: Message[]): string => {
    const userMessages = msgs.filter(m => m.role === 'user');
    
    // Look for audience-related keywords
    for (const msg of userMessages) {
      const content = msg.content.toLowerCase();
      if (content.includes('user') || content.includes('people') || content.includes('audience')) {
        const sentences = msg.content.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes('user') || 
              sentence.toLowerCase().includes('people') ||
              sentence.toLowerCase().includes('who')) {
            return sentence.trim();
          }
        }
      }
    }
    
    return 'Primary users who will benefit from this solution and its core functionality.';
  };

  const extractTechnicalRequirements = (msgs: Message[]): string => {
    const userMessages = msgs.filter(m => m.role === 'user');
    const techRequirements: string[] = [];
    
    // Look for technical keywords
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      const techKeywords = ['web', 'mobile', 'app', 'api', 'database', 'cloud', 'platform', 'integration', 'react', 'node', 'javascript', 'typescript'];
      
      techKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          techRequirements.push(`- ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} integration/support`);
        }
      });
    });
    
    if (techRequirements.length === 0) {
      return `- Modern web technologies
- Responsive design
- Scalable architecture
- Secure data handling`;
    }
    
    return [...new Set(techRequirements)].slice(0, 6).join('\n');
  };

  // Generate PRD using the specialized prompt
  const generatePRD = async () => {
    if (!socketRef) {
      console.error('No socket connection available');
      return;
    }

    setIsGeneratingPRD(true);
    setCurrentPhase('prd-generation');
    setPrdProgress(0);
    setEstimatedTimeRemaining(60);
    
    // Start progress simulation
    const progressInterval = setInterval(() => {
      setPrdProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 3 + 1; // Random progress between 1-4%
      });
      
      setEstimatedTimeRemaining(prev => Math.max(0, prev - 2));
    }, 1000);

    // Include full conversation history for context
    const fullConversationContext = messages.map(msg => 
      `**${msg.role === 'user' ? 'User' : 'Assistant'}**: ${msg.content}`
    ).join('\n\n');

    const prdPrompt = `You are an expert technical product manager specializing in feature development and creating comprehensive product requirements documents (PRDs). Your task is to generate a detailed and well-structured PRD based on the following conversation and project summary:

<conversation_history>
${fullConversationContext}
</conversation_history>

<project_summary>
${conversationSummary}
</project_summary>

**IMPORTANT**: Use BOTH the conversation history and project summary to create a comprehensive PRD. The conversation history contains the original ideas, suggestions, and refinements discussed between the user and assistant. Make sure to incorporate all relevant details, features, and requirements mentioned throughout the conversation.

Follow these steps to create the PRD:

1. Begin with a brief overview explaining the project and the purpose of the document.

2. Use sentence case for all headings except for the title of the document, which should be in title case.

3. Organize your PRD into the following sections:
   a. Introduction
   b. Product Overview
   c. Goals and Objectives
   d. Target Audience
   e. Features and Requirements
   f. User Stories and Acceptance Criteria
   g. Technical Requirements / Stack
   h. Design and User Interface

4. For each section, provide detailed and relevant information based on the PRD instructions. Ensure that you:
   - Use clear and concise language
   - Provide specific details and metrics where required
   - Maintain consistency throughout the document
   - Address all points mentioned in each section

5. When creating user stories and acceptance criteria:
   - List ALL necessary user stories including primary, alternative, and edge-case scenarios
   - Assign a unique requirement ID (e.g., ST-101) to each user story for direct traceability
   - Include at least one user story specifically for secure access or authentication if the application requires user identification
   - Include at least one user story specifically for Database modelling if the application requires a database
   - Ensure no potential user interaction is omitted
   - Make sure each user story is testable

6. Format your PRD professionally:
   - Use consistent styles
   - Include numbered sections and subsections
   - Use bullet points and tables where appropriate to improve readability
   - Ensure proper spacing and alignment throughout the document

7. Review your PRD to ensure all aspects of the project are covered comprehensively and that there are no contradictions or ambiguities.

Present your final PRD within <PRD> tags. Begin with the title of the document in title case, followed by each section with its corresponding content. Use appropriate subheadings within each section as needed.

Remember to tailor the content to the specific project described in the PRD instructions, providing detailed and relevant information for each section based on the given context.`;

    socketRef.emit('send-message', {
      sessionId,
      message: prdPrompt,
      stage: 'prd',
      useCase: 'general'  // Use the working Claude model instead of broken Gemini
    });
  };

  // Copy content to clipboard
  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(type);
      setTimeout(() => setCopiedContent(null), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToChat}
              className="w-10 h-10 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg magical-glow hover:scale-105 transition-transform duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-amber-900" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">The Room</h1>
              <p className="text-xs text-gray-400">
                {currentPhase === 'summary' && 'Project Summary'}
                {currentPhase === 'prd-generation' && 'Generating PRD...'}
                {currentPhase === 'prd-complete' && 'PRD Complete'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-purple-900/30 rounded-lg border border-purple-600/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-sm text-purple-200 capitalize">
                  {currentPhase === 'summary' && 'Summary Phase'}
                  {currentPhase === 'prd-generation' && 'PRD Generation'}
                  {currentPhase === 'prd-complete' && 'PRD Complete'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {currentPhase === 'summary' && (
          <div className="space-y-6">
            {/* Summary Phase */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-semibold text-white">Project Summary</h2>
                </div>
                <button
                  onClick={() => copyToClipboard(conversationSummary, 'summary')}
                  className="p-2 text-gray-400 hover:text-gray-200 rounded-lg transition-colors"
                  title="Copy summary"
                >
                  {copiedContent === 'summary' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <div className="prose prose-invert max-w-none">
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
                        <code className="bg-gray-700/60 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {conversationSummary}
                </ReactMarkdown>
              </div>
            </div>

                         {/* Generate PRD Button */}
             <div className="flex justify-center">
               <button
                 onClick={generatePRD}
                 disabled={isGeneratingPRD}
                 className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center gap-3 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
               >
                                 {isGeneratingPRD ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                   <Wand2 className="w-5 h-5" />
                 )}
                 <span>{isGeneratingPRD ? 'Generating PRD...' : 'Generate Comprehensive PRD'}</span>
                 {!isGeneratingPRD && <Sparkles className="w-5 h-5" />}
                
                {/* Magical glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                
                {/* Subtle pulse animation */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-blue-400 opacity-20 animate-ping"></div>
              </button>
            </div>
          </div>
        )}

        {currentPhase === 'prd-generation' && (
          <div className="space-y-6">
            {/* PRD Generation Phase */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Generating Your PRD</h2>
                  <p className="text-gray-400">
                    Creating a comprehensive Product Requirements Document based on your project description...
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Progress</span>
                    <span className="text-purple-300">{Math.round(prdProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${prdProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Analyzing requirements...</span>
                    <span>~{estimatedTimeRemaining}s remaining</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-sm text-purple-300">Processing...</span>
                </div>
              </div>
            </div>

            {/* Live PRD Content (if streaming) */}
            {prdContent && (
              <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">PRD Generation in Progress</h3>
                </div>
                
                <div className="prose prose-invert max-w-none">
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
                          <code className="bg-gray-700/60 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {prdContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPhase === 'prd-complete' && (
          <div className="space-y-6">
            {/* PRD Complete Phase */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-semibold text-white">Product Requirements Document</h2>
                </div>
                <button
                  onClick={() => copyToClipboard(prdContent, 'prd')}
                  className="p-2 text-gray-400 hover:text-gray-200 rounded-lg transition-colors"
                  title="Copy PRD"
                >
                  {copiedContent === 'prd' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <div className="prose prose-invert max-w-none">
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
                        <code className="bg-gray-700/60 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {prdContent}
                </ReactMarkdown>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Next Steps</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Create Tasks</span>
                  </div>
                  <p className="text-xs text-blue-300/70">Break down PRD into actionable development tasks</p>
                </button>
                
                <button className="p-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-3 mb-2">
                    <Wand2 className="w-5 h-5" />
                    <span className="font-medium">Generate Code</span>
                  </div>
                  <p className="text-xs text-green-300/70">Create starter code and project structure</p>
                </button>
                
                <button 
                  onClick={onBackToChat}
                  className="p-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Continue Chat</span>
                  </div>
                  <p className="text-xs text-purple-300/70">Return to conversation for refinements</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDashboard; 