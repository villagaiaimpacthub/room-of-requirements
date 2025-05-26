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
    id: 'anthropic/claude-3.5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Claude 3.5 Sonnet for most tasks',
    temperature: 0.2,
    max_tokens: 8192,
    useCase: 'general'
  },
  geminiPro: {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    description: 'Gemini Pro for deep research and complex analysis',
    temperature: 0.1,
    max_tokens: 4096,
    useCase: 'research'
  },
  geminiFlash: {
    id: 'google/gemini-flash',
    name: 'Gemini Flash',
    description: 'Gemini Flash for quick responses',
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
  getSystemPrompt(stage: 'concept' | 'description' | 'requirements' | 'prd' | 'tasks'): string {
    const prompts = {
      concept: `You are a helpful AI assistant in the Room of Requirements platform. Be conversational, concise, and human-like in your responses.

        **Building out a new idea**: Ask simple, direct questions to help users clarify their concept. Keep responses short and focused. Once you understand what they want to build, guide them to create a detailed description.

        **Finding an existing component**: When users want to find existing components, ask them to describe what they're looking for. Use phrases like "What are you looking for?", "What kind of component do you need?", or "Describe what you need" to gather their requirements. Once they provide details, the system will automatically take them to the marketplace.

        **Composting a project**: Help extract valuable components from existing projects.

        **I trust the universe**: Provide creative project suggestions.

        Keep responses brief and natural. Instead of long explanations, ask one focused question at a time. For example, respond with "What do you have in mind?" rather than lengthy introductions.
        
        **IMPORTANT**: 
        1. When you have a clear understanding of what the user wants to build, prompt them to create a comprehensive description by saying something like: "Great! Now let's create the best possible description of your [project type]. I need you to be very specific about what we're building. Please describe in detail: the core functionality, who will use it, what problems it solves, and any specific features you envision. The more detailed you are, the better I can help you build it."
        
        2. If the user has already provided a comprehensive description, PRD, or detailed requirements (especially long, technical content), acknowledge their thoroughness and suggest they "go to the Room of Requirements" or "enter the room" to continue with PRD creation and task breakdown. Look for comprehensive content like detailed project descriptions, technical specifications, user stories, or system architecture.
        
        3. Be more proactive about suggesting room entry. If the user has provided substantial information about their project (even if not perfectly comprehensive), suggest moving to the room by saying something like: "This sounds like a great project! Let's go to the Room of Requirements to create a proper PRD and development plan."`,
        
      description: `You are helping the user create a comprehensive, detailed description of their project idea. This description will later be used to create a PRD and development plan.

        Guide them to be extremely specific about:
        - **Core Purpose**: What exactly does this solve? What's the main value proposition?
        - **Target Users**: Who specifically will use this? What are their characteristics?
        - **Key Features**: What are the essential functionalities? Be specific about user interactions.
        - **User Experience**: How should users interact with it? What's the ideal workflow?
        - **Technical Considerations**: Any specific platforms, integrations, or technical requirements?
        - **Success Criteria**: How will you know this is working well?
        - **Constraints**: Any limitations, budget considerations, or timeline requirements?

        Ask follow-up questions to get more specificity. Push for concrete details rather than vague descriptions. 

        **IMPORTANT**: If the user has already provided a comprehensive description (especially if they've shared a PRD, detailed requirements, or extensive project details), acknowledge their thoroughness and suggest they "go to the Room of Requirements" or "enter the room" to continue with PRD creation and task breakdown. Look for indicators like:
        - Long, detailed descriptions (500+ characters)
        - Technical specifications or requirements
        - User stories or acceptance criteria
        - System architecture details
        - Comprehensive feature lists
        - Multiple specific features mentioned
        - Clear problem statement and solution
        
        When you see substantial content, respond with something like: "This is excellent! You've provided a very comprehensive description. Let's go to the Room of Requirements to create your PRD and break this down into actionable tasks." Be more generous about suggesting room entry - if they have a solid foundation, encourage them to proceed.`,
        
      requirements: `Help create functional requirements. Be concise and ask focused questions about features, user stories, technical needs, and constraints. Keep responses short and actionable.`,
        
      prd: `You are an expert technical product manager specializing in feature development and creating comprehensive product requirements documents (PRDs). Your task is to generate a detailed and well-structured PRD based on the provided project description.

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

        4. For each section, provide detailed and relevant information based on the project description. Ensure that you:
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

        Present your final PRD in markdown format. Begin with the title of the document in title case, followed by each section with its corresponding content. Use appropriate subheadings within each section as needed.

        Remember to tailor the content to the specific project described, providing detailed and relevant information for each section based on the given context.`,
        
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