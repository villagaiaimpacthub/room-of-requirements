import fetch from 'node-fetch';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Model configurations for different use cases
const MODEL_CONFIGS = {
  claude: {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Primary model for most tasks',
    temperature: 0.2,
    max_tokens: 8192,
    useCase: 'general'
  },
  geminiPro: {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    description: 'Deep research and complex analysis',
    temperature: 0.1,
    max_tokens: 4096,
    useCase: 'research'
  },
  geminiFlash: {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini Flash',
    description: 'Quick responses for simple tasks',
    temperature: 0.3,
    max_tokens: 4096,
    useCase: 'quick'
  }
} as const;

type ModelType = keyof typeof MODEL_CONFIGS;

class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    console.log('🔍 Environment variables check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- OPENROUTER_API_KEY present:', !!process.env.OPENROUTER_API_KEY);
    console.log('- OPENROUTER_API_KEY length:', process.env.OPENROUTER_API_KEY?.length || 0);
    
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.error('❌ OPENROUTER_API_KEY not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('OPENROUTER')));
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    console.log('✅ OpenRouter API key loaded successfully');
  }

  // Get model configuration based on use case
  private getModelForUseCase(useCase: 'general' | 'research' | 'quick'): ModelType {
    switch (useCase) {
      case 'research':
        return 'geminiPro';
      case 'quick':
        return 'geminiFlash';
      default:
        return 'claude';
    }
  }

  // Send a chat completion request
  async sendMessage(
    messages: OpenRouterMessage[], 
    useCase: 'general' | 'research' | 'quick' = 'general',
    stream = false
  ): Promise<OpenRouterResponse | any> {
    const modelType = this.getModelForUseCase(useCase);
    const modelConfig = MODEL_CONFIGS[modelType];

    console.log(`🤖 Sending request to OpenRouter:`, {
      model: modelConfig.id,
      messageCount: messages.length,
      useCase,
      stream,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens
    });

    const requestBody: OpenRouterRequest = {
      model: modelConfig.id,
      messages,
      stream,
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.max_tokens,
    };

    console.log(`📤 Request body:`, JSON.stringify(requestBody, null, 2));

    // Debug the authorization header
    console.log('🔐 Authorization check:');
    console.log('- API Key present:', !!this.apiKey);
    console.log('- API Key length:', this.apiKey?.length || 0);
    console.log('- Authorization header:', `Bearer ${this.apiKey}`.substring(0, 20) + '...');

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.GITHUB_REPO || 'https://github.com/villagaiaimpacthub/room-of-requirements',
      'X-Title': 'Room of Requirements',
    };

    console.log('📋 Request headers:', Object.keys(headers));

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 OpenRouter response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouter API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    if (stream) {
      console.log(`🌊 Returning streaming response`);
      return response.body as any;
    } else {
      const result = await response.json() as OpenRouterResponse;
      console.log(`✅ Got non-streaming response:`, {
        id: result.id,
        contentLength: result.choices?.[0]?.message?.content?.length || 0,
        finishReason: result.choices?.[0]?.finish_reason,
        usage: result.usage
      });
      return result;
    }
  }

  // Send a streaming chat completion request
  async sendStreamingMessage(
    messages: OpenRouterMessage[],
    useCase: 'general' | 'research' | 'quick' = 'general'
  ): Promise<any> {
    return this.sendMessage(messages, useCase, true) as Promise<any>;
  }

  // Utility method to format conversation for AI
  formatConversation(userMessage: string, systemPrompt?: string): OpenRouterMessage[] {
    const messages: OpenRouterMessage[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  // System prompts for different Room of Requirements stages
  getSystemPrompt(stage: 'concept' | 'requirements' | 'prd' | 'tasks'): string {
    const prompts = {
      concept: `You are an AI assistant helping users in the Room of Requirements platform. You help with different types of project interactions:

        **Building out a new idea**: Help users articulate their concept clearly by asking thoughtful questions about:
        - The core problem they're solving
        - Target audience and use cases
        - Key features and functionality
        - Technical considerations
        - Success metrics and goals

        **Finding an existing component**: Help users discover reusable building blocks, libraries, frameworks, or existing solutions that could accelerate their development.

        **Composting a project**: Help users thoughtfully decompose/retire an existing project by:
        - Identifying valuable components that can be extracted and reused
        - Documenting lessons learned and knowledge to preserve
        - Planning how to gracefully sunset the project
        - Determining what parts should be open-sourced or shared with the ecosystem
        - Creating a "compost plan" to return valuable elements back to the development community

        **I trust the universe**: Provide serendipitous project suggestions, random inspiration, or unexpected connections that might spark new ideas.

        Be conversational, encouraging, and help them think through their needs systematically. Pay attention to the specific type of interaction they're requesting.`,
        
      requirements: `You are helping a user create functional requirements from their project concept.
        Guide them to specify:
        - Clear feature descriptions
        - User stories and acceptance criteria
        - Technical requirements and constraints
        - Integration needs and dependencies
        - Non-functional requirements (performance, security, etc.)
        
        Ask clarifying questions and help them be specific and comprehensive.`,
        
      prd: `You are helping create a comprehensive Product Requirements Document (PRD).
        Structure the conversation to cover:
        - Executive summary and vision
        - Target audience and user personas
        - Feature specifications with acceptance criteria
        - Technical architecture and stack
        - Success metrics and KPIs
        - Implementation roadmap
        
        Generate a professional, detailed PRD that serves as a blueprint for development.`,
        
      tasks: `You are helping break down a PRD into actionable development tasks.
        Focus on:
        - Identifying discrete, implementable tasks
        - Analyzing task complexity and dependencies
        - Estimating effort and timeline
        - Prioritizing based on dependencies and business value
        - Creating subtasks for complex items
        
        Use the TaskMaster framework for structured task management.`
    };

    return prompts[stage];
  }

  // Get available models and their configurations
  getAvailableModels() {
    return MODEL_CONFIGS;
  }
}

export default OpenRouterService; 