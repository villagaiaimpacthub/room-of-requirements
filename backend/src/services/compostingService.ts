import { v4 as uuidv4 } from 'uuid';
import FileProcessorService, { ProcessedFile, ComponentChunk } from './fileProcessor';
import OpenRouterService from './openrouter';

export interface CompostingSession {
  id: string;
  userId?: string;
  projectName: string;
  projectDescription: string;
  files: ProcessedFile[];
  components: ComponentChunk[];
  status: 'uploading' | 'describing' | 'processing' | 'reviewing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  progress: {
    filesProcessed: number;
    totalFiles: number;
    componentsExtracted: number;
    currentStep: string;
  };
}

export interface CompostingProgress {
  sessionId: string;
  step: string;
  progress: number;
  message: string;
  data?: any;
}

class CompostingService {
  private sessions: Map<string, CompostingSession> = new Map();
  private fileProcessor: FileProcessorService;
  private openRouterService: OpenRouterService;

  constructor() {
    this.fileProcessor = new FileProcessorService();
    this.openRouterService = new OpenRouterService();
  }

  // Create a new composting session
  createSession(projectName: string = 'Untitled Project'): CompostingSession {
    const sessionId = uuidv4();
    const session: CompostingSession = {
      id: sessionId,
      projectName,
      projectDescription: '',
      files: [],
      components: [],
      status: 'uploading',
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        filesProcessed: 0,
        totalFiles: 0,
        componentsExtracted: 0,
        currentStep: 'Waiting for file upload'
      }
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  // Get session by ID
  getSession(sessionId: string): CompostingSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Update session
  private updateSession(sessionId: string, updates: Partial<CompostingSession>): CompostingSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  // Process uploaded files
  async processFiles(
    sessionId: string, 
    filePaths: string[], 
    fileNames: string[], 
    mimeTypes: string[],
    progressCallback?: (progress: CompostingProgress) => void
  ): Promise<ProcessedFile[]> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    this.updateSession(sessionId, {
      status: 'processing',
      progress: {
        ...session.progress,
        totalFiles: filePaths.length,
        currentStep: 'Processing uploaded files'
      }
    });

    const processedFiles: ProcessedFile[] = [];

    for (let i = 0; i < filePaths.length; i++) {
      try {
        progressCallback?.({
          sessionId,
          step: 'processing_files',
          progress: Math.round((i / filePaths.length) * 50), // First 50% for file processing
          message: `Processing ${fileNames[i]}...`,
          data: { currentFile: fileNames[i] }
        });

        const processedFile = await this.fileProcessor.processFile(
          filePaths[i],
          fileNames[i],
          mimeTypes[i]
        );

        processedFiles.push(processedFile);

        // Update session progress
        this.updateSession(sessionId, {
          progress: {
            ...session.progress,
            filesProcessed: i + 1,
            currentStep: `Processed ${i + 1}/${filePaths.length} files`
          }
        });

        // Clean up uploaded file
        await this.fileProcessor.cleanupFile(filePaths[i]);

      } catch (error) {
        console.error(`Error processing file ${fileNames[i]}:`, error);
        progressCallback?.({
          sessionId,
          step: 'error',
          progress: 0,
          message: `Error processing ${fileNames[i]}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: { error: true, fileName: fileNames[i] }
        });
      }
    }

    // Update session with processed files
    this.updateSession(sessionId, {
      files: processedFiles,
      progress: {
        ...session.progress,
        filesProcessed: processedFiles.length,
        currentStep: 'Files processed successfully'
      }
    });

    return processedFiles;
  }

  // Update project description
  updateProjectDescription(sessionId: string, description: string): CompostingSession | null {
    return this.updateSession(sessionId, {
      projectDescription: description,
      status: 'describing'
    });
  }

  // Extract components using AI
  async extractComponents(
    sessionId: string,
    progressCallback?: (progress: CompostingProgress) => void
  ): Promise<ComponentChunk[]> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    if (session.files.length === 0) {
      throw new Error('No files to process');
    }

    this.updateSession(sessionId, {
      status: 'processing',
      progress: {
        ...session.progress,
        currentStep: 'Extracting reusable components'
      }
    });

    progressCallback?.({
      sessionId,
      step: 'extracting_components',
      progress: 50,
      message: 'Analyzing content for reusable components...'
    });

    try {
      // Use AI to enhance component extraction
      const enhancedComponents = await this.aiEnhancedComponentExtraction(
        session.files,
        session.projectDescription,
        progressCallback
      );

      // Update session with extracted components
      this.updateSession(sessionId, {
        components: enhancedComponents,
        status: 'reviewing',
        progress: {
          ...session.progress,
          componentsExtracted: enhancedComponents.length,
          currentStep: 'Components extracted successfully'
        }
      });

      progressCallback?.({
        sessionId,
        step: 'components_ready',
        progress: 100,
        message: `Extracted ${enhancedComponents.length} reusable components`,
        data: { components: enhancedComponents }
      });

      return enhancedComponents;

    } catch (error) {
      console.error('Error extracting components:', error);
      progressCallback?.({
        sessionId,
        step: 'error',
        progress: 0,
        message: `Error extracting components: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error: true }
      });
      throw error;
    }
  }

  // AI-enhanced component extraction
  private async aiEnhancedComponentExtraction(
    files: ProcessedFile[],
    projectDescription: string,
    progressCallback?: (progress: CompostingProgress) => void
  ): Promise<ComponentChunk[]> {
    // Start with basic chunking
    const basicChunks = await this.fileProcessor.chunkIntoComponents(files, projectDescription);

    progressCallback?.({
      sessionId: '',
      step: 'ai_analysis',
      progress: 70,
      message: 'Enhancing components with AI analysis...'
    });

    // Prepare content for AI analysis
    const combinedContent = files.map(file => 
      `File: ${file.originalName}\nContent:\n${file.content}\n\n`
    ).join('');

    const aiPrompt = this.buildComponentExtractionPrompt(combinedContent, projectDescription, basicChunks);

    try {
      const aiResponse = await this.openRouterService.sendMessage([
        { role: 'system', content: 'You are an expert software architect specializing in component extraction and reusability analysis.' },
        { role: 'user', content: aiPrompt }
      ], 'general');

      // Parse AI response and enhance components
      const enhancedComponents = this.parseAiComponentResponse(aiResponse, basicChunks);

      progressCallback?.({
        sessionId: '',
        step: 'ai_complete',
        progress: 90,
        message: 'AI analysis complete, finalizing components...'
      });

      return enhancedComponents;

    } catch (error) {
      console.error('AI enhancement failed, using basic chunking:', error);
      // Fallback to basic chunking if AI fails
      return basicChunks;
    }
  }

  // Build prompt for AI component extraction
  private buildComponentExtractionPrompt(content: string, projectDescription: string, basicChunks: ComponentChunk[]): string {
    return `
Project Description: ${projectDescription}

Project Content:
${content.substring(0, 8000)} ${content.length > 8000 ? '...(truncated)' : ''}

Basic Components Identified: ${basicChunks.length}

Please analyze this project and provide enhanced component extraction with the following:

1. Identify the most reusable components from the content
2. Improve component titles and descriptions
3. Enhance tags and categorization
4. Adjust reusability scores (0-100)
5. Identify dependencies between components
6. Suggest component combinations or splits

Respond in JSON format:
{
  "components": [
    {
      "title": "Component Title",
      "description": "Brief description of what this component does",
      "type": "code|documentation|configuration|design|other",
      "tags": ["tag1", "tag2"],
      "reusabilityScore": 85,
      "dependencies": ["dependency1"],
      "content": "actual component content",
      "improvements": "suggested improvements for reusability"
    }
  ],
  "insights": "Overall insights about the project's reusable components"
}

Focus on components that would be valuable in a marketplace for other developers.
`;
  }

  // Parse AI response and enhance components
  private parseAiComponentResponse(aiResponse: any, fallbackComponents: ComponentChunk[]): ComponentChunk[] {
    try {
      const responseContent = typeof aiResponse === 'string' ? aiResponse : aiResponse.choices?.[0]?.message?.content;
      
      if (!responseContent) {
        return fallbackComponents;
      }

      // Extract JSON from response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return fallbackComponents;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.components || !Array.isArray(parsed.components)) {
        return fallbackComponents;
      }

      // Convert AI response to ComponentChunk format
      return parsed.components.map((comp: any, index: number) => ({
        id: `ai_component_${Date.now()}_${index}`,
        title: comp.title || `Component ${index + 1}`,
        content: comp.content || '',
        type: comp.type || 'other',
        tags: Array.isArray(comp.tags) ? comp.tags : [],
        reusabilityScore: typeof comp.reusabilityScore === 'number' ? comp.reusabilityScore : 50,
        dependencies: Array.isArray(comp.dependencies) ? comp.dependencies : []
      }));

    } catch (error) {
      console.error('Error parsing AI response:', error);
      return fallbackComponents;
    }
  }

  // Complete composting session
  completeSession(sessionId: string): CompostingSession | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    return this.updateSession(sessionId, {
      status: 'completed',
      progress: {
        ...session.progress,
        currentStep: 'Composting completed successfully'
      }
    });
  }

  // Get all sessions (for admin dashboard)
  getAllSessions(): CompostingSession[] {
    return Array.from(this.sessions.values());
  }

  // Delete session
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  // Get session statistics
  getSessionStats(sessionId: string): any {
    const session = this.getSession(sessionId);
    if (!session) return null;

    return {
      sessionId,
      projectName: session.projectName,
      status: session.status,
      filesCount: session.files.length,
      componentsCount: session.components.length,
      totalWords: session.files.reduce((sum, file) => sum + file.metadata.wordCount, 0),
      averageReusabilityScore: session.components.length > 0 
        ? Math.round(session.components.reduce((sum, comp) => sum + comp.reusabilityScore, 0) / session.components.length)
        : 0,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }
}

export default CompostingService; 