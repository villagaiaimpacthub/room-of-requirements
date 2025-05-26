import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Wand2, 
  BookOpen, 
  Target, 
  CheckCircle, 
  Clock, 
  Users, 
  Code, 
  Lightbulb,
  ArrowLeft,
  Plus,
  FileText,
  GitBranch,
  Recycle,
  Shuffle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  useCase?: 'general' | 'research' | 'quick';
}

interface ProjectContext {
  type: 'build' | 'find' | 'compost' | 'universe' | 'general';
  title?: string;
  description?: string;
  stage: 'concept' | 'requirements' | 'prd' | 'tasks' | 'implementation';
  insights: string[];
  nextSteps: string[];
  resources: Array<{
    title: string;
    type: 'component' | 'library' | 'documentation' | 'template';
    url?: string;
    description: string;
  }>;
}

interface RoomDashboardProps {
  messages: Message[];
  onBackToChat: () => void;
  className?: string;
}

const RoomDashboard: React.FC<RoomDashboardProps> = ({ 
  messages, 
  onBackToChat, 
  className = '' 
}) => {
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');

  // Analyze conversation context to determine project type and insights
  useEffect(() => {
    if (messages.length > 0) {
      const context = analyzeConversationContext(messages);
      setProjectContext(context);
    }
  }, [messages]);

  // Analyze conversation to extract project context
  const analyzeConversationContext = (msgs: Message[]): ProjectContext => {
    const userMessages = msgs.filter(m => m.role === 'user');
    const assistantMessages = msgs.filter(m => m.role === 'assistant');
    
    // Determine project type from first user message
    const firstMessage = userMessages[0]?.content.toLowerCase() || '';
    let type: ProjectContext['type'] = 'general';
    
    if (firstMessage.includes('build') || firstMessage.includes('new idea')) {
      type = 'build';
    } else if (firstMessage.includes('find') || firstMessage.includes('component')) {
      type = 'find';
    } else if (firstMessage.includes('compost')) {
      type = 'compost';
    } else if (firstMessage.includes('universe') || firstMessage.includes('trust')) {
      type = 'universe';
    }

    // Extract insights from assistant responses
    const insights = assistantMessages
      .slice(0, 3)
      .map(msg => msg.content.split('\n')[0])
      .filter(insight => insight.length > 20 && insight.length < 200);

    // Generate next steps based on project type
    const nextSteps = generateNextSteps(type, userMessages);
    
    // Generate relevant resources
    const resources = generateResources(type);

    return {
      type,
      title: extractProjectTitle(userMessages),
      description: extractProjectDescription(assistantMessages),
      stage: 'concept',
      insights: insights.slice(0, 3),
      nextSteps,
      resources
    };
  };

  const extractProjectTitle = (userMessages: Message[]): string => {
    const content = userMessages.slice(0, 2).map(m => m.content).join(' ');
    // Simple extraction - in a real app, you'd use NLP
    if (content.length > 10) {
      return content.split('.')[0].substring(0, 50) + '...';
    }
    return 'Your Project';
  };

  const extractProjectDescription = (assistantMessages: Message[]): string => {
    const firstResponse = assistantMessages[0]?.content || '';
    const sentences = firstResponse.split('.').filter(s => s.length > 20);
    return sentences[0] + '.' || 'Let\'s develop your idea together.';
  };

  const generateNextSteps = (type: ProjectContext['type'], userMessages: Message[]): string[] => {
    const baseSteps = {
      build: [
        'Define your core problem and target audience',
        'Create detailed feature specifications',
        'Design system architecture',
        'Set up development environment'
      ],
      find: [
        'Research existing solutions and libraries',
        'Evaluate compatibility and licensing',
        'Create integration plan',
        'Test and validate components'
      ],
      compost: [
        'Audit existing codebase and assets',
        'Identify reusable components',
        'Document lessons learned',
        'Plan graceful sunset strategy'
      ],
      universe: [
        'Explore unexpected connections',
        'Research emerging technologies',
        'Connect with relevant communities',
        'Prototype experimental ideas'
      ],
      general: [
        'Clarify your project goals',
        'Gather requirements',
        'Create project roadmap',
        'Start development planning'
      ]
    };

    return baseSteps[type] || baseSteps.general;
  };

  const generateResources = (type: ProjectContext['type']) => {
    const resourceMap = {
      build: [
        { title: 'React Component Library', type: 'library' as const, description: 'Pre-built UI components for rapid development' },
        { title: 'API Design Guide', type: 'documentation' as const, description: 'Best practices for designing RESTful APIs' },
        { title: 'Project Template', type: 'template' as const, description: 'Starter template with modern tooling' }
      ],
      find: [
        { title: 'NPM Package Search', type: 'library' as const, description: 'Discover and evaluate JavaScript packages' },
        { title: 'Component Gallery', type: 'component' as const, description: 'Browse reusable UI components' },
        { title: 'Integration Patterns', type: 'documentation' as const, description: 'Common patterns for integrating third-party libraries' }
      ],
      compost: [
        { title: 'Code Analysis Tools', type: 'library' as const, description: 'Tools for analyzing and refactoring legacy code' },
        { title: 'Migration Guide', type: 'documentation' as const, description: 'Step-by-step guide for project migration' },
        { title: 'Asset Extraction', type: 'template' as const, description: 'Templates for extracting reusable components' }
      ],
      universe: [
        { title: 'Emerging Tech Radar', type: 'documentation' as const, description: 'Latest trends and technologies to explore' },
        { title: 'Experimental APIs', type: 'library' as const, description: 'Cutting-edge APIs and frameworks' },
        { title: 'Innovation Templates', type: 'template' as const, description: 'Templates for experimental projects' }
      ],
      general: [
        { title: 'Project Planning', type: 'template' as const, description: 'Templates and tools for project planning' },
        { title: 'Development Resources', type: 'library' as const, description: 'Essential libraries and tools' },
        { title: 'Best Practices', type: 'documentation' as const, description: 'Industry best practices and guidelines' }
      ]
    };

    return resourceMap[type] || resourceMap.general;
  };

  const getProjectTypeIcon = (type: ProjectContext['type']) => {
    const iconMap = {
      build: <Lightbulb className="w-5 h-5" />,
      find: <Code className="w-5 h-5" />,
      compost: <Recycle className="w-5 h-5" />,
      universe: <Shuffle className="w-5 h-5" />,
      general: <Target className="w-5 h-5" />
    };
    return iconMap[type] || iconMap.general;
  };

  const getProjectTypeColor = (type: ProjectContext['type']) => {
    const colorMap = {
      build: 'from-blue-500 to-purple-600',
      find: 'from-green-500 to-teal-600',
      compost: 'from-orange-500 to-red-600',
      universe: 'from-purple-500 to-pink-600',
      general: 'from-amber-500 to-yellow-600'
    };
    return colorMap[type] || colorMap.general;
  };

  if (!projectContext) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Analyzing your conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToChat}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`w-10 h-10 bg-gradient-to-br ${getProjectTypeColor(projectContext.type)} rounded-lg flex items-center justify-center shadow-lg`}>
              {getProjectTypeIcon(projectContext.type)}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{projectContext.title}</h1>
              <p className="text-xs text-gray-400">Room of Requirements • {projectContext.type} project</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-300 capitalize">{projectContext.stage}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Project Overview */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Summary */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Project Overview</h2>
              </div>
              <p className="text-gray-300 mb-6">{projectContext.description}</p>
              
              {/* Insights from Conversation */}
              {projectContext.insights.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Key Insights</h3>
                  {projectContext.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg">
                      <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300">{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Recommended Next Steps</h2>
              </div>
              <div className="space-y-3">
                {projectContext.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-gray-300 group-hover:text-white transition-colors">{step}</p>
                    <Plus className="w-4 h-4 text-gray-500 group-hover:text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Code className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Recommended Resources</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectContext.resources.map((resource, index) => (
                  <div key={index} className="p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        {resource.type === 'component' && <GitBranch className="w-4 h-4" />}
                        {resource.type === 'library' && <Code className="w-4 h-4" />}
                        {resource.type === 'documentation' && <FileText className="w-4 h-4" />}
                        {resource.type === 'template' && <Wand2 className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white group-hover:text-green-400 transition-colors">{resource.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{resource.description}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-600/50 text-xs text-gray-300 rounded capitalize">
                          {resource.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Progress */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wand2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              </div>
              <div className="space-y-3">
                <button className="w-full p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Generate PRD</span>
                  </div>
                  <p className="text-xs text-amber-300/70 mt-1">Create detailed requirements</p>
                </button>
                
                <button className="w-full p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Create Tasks</span>
                  </div>
                  <p className="text-xs text-blue-300/70 mt-1">Break down into actionable items</p>
                </button>
                
                <button className="w-full p-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Code className="w-4 h-4" />
                    <span className="font-medium">Start Coding</span>
                  </div>
                  <p className="text-xs text-green-300/70 mt-1">Generate starter code</p>
                </button>
              </div>
            </div>

            {/* Project Progress */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Progress</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Concept Development</span>
                    <span className="text-purple-400">75%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Requirements</span>
                    <span className="text-gray-400">0%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gray-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Implementation</span>
                    <span className="text-gray-400">0%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gray-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversation Summary */}
            <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Conversation</h2>
              </div>
              <div className="text-sm text-gray-400 space-y-2">
                <p>{messages.length} messages exchanged</p>
                <p>Last activity: {new Date(messages[messages.length - 1]?.timestamp || new Date()).toLocaleTimeString()}</p>
                <button 
                  onClick={onBackToChat}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Continue conversation →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDashboard; 