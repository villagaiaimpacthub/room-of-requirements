import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import MarkdownIt from 'markdown-it';

export interface ProcessedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: string;
  metadata: {
    pages?: number;
    wordCount: number;
    extractedAt: Date;
  };
}

export interface ComponentChunk {
  id: string;
  title: string;
  content: string;
  type: 'code' | 'documentation' | 'configuration' | 'design' | 'other';
  tags: string[];
  reusabilityScore: number;
  dependencies?: string[];
}

class FileProcessorService {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt();
  }

  // Process uploaded file and extract content
  async processFile(filePath: string, originalName: string, mimeType: string): Promise<ProcessedFile> {
    const fileId = this.generateFileId();
    const stats = fs.statSync(filePath);
    
    let content = '';
    let metadata: any = {
      extractedAt: new Date(),
      wordCount: 0
    };

    // Fix MIME type detection for common file extensions
    let correctedMimeType = mimeType;
    const extension = path.extname(originalName).toLowerCase();
    
    if (mimeType === 'application/octet-stream') {
      switch (extension) {
        case '.md':
        case '.markdown':
          correctedMimeType = 'text/markdown';
          break;
        case '.txt':
          correctedMimeType = 'text/plain';
          break;
        case '.pdf':
          correctedMimeType = 'application/pdf';
          break;
        case '.docx':
          correctedMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
      }
    }

    try {
      switch (correctedMimeType) {
        case 'application/pdf':
          content = await this.extractPdfContent(filePath);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await this.extractDocxContent(filePath);
          break;
        case 'text/markdown':
        case 'text/x-markdown':
          content = await this.extractMarkdownContent(filePath);
          break;
        case 'text/plain':
          content = await this.extractTextContent(filePath);
          break;
        case 'image/png':
        case 'image/jpeg':
        case 'image/gif':
          content = await this.extractImageContent(filePath, originalName);
          break;
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }

      metadata.wordCount = this.countWords(content);

      return {
        id: fileId,
        originalName,
        mimeType: correctedMimeType,
        size: stats.size,
        content,
        metadata
      };
    } catch (error) {
      console.error(`Error processing file ${originalName}:`, error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Extract content from PDF files
  private async extractPdfContent(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  // Extract content from DOCX files
  private async extractDocxContent(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // Extract content from Markdown files
  private async extractMarkdownContent(filePath: string): Promise<string> {
    const content = fs.readFileSync(filePath, 'utf8');
    // Return both raw markdown and rendered HTML for processing
    return content;
  }

  // Extract content from text files
  private async extractTextContent(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf8');
  }

  // Extract content from image files using AI vision
  private async extractImageContent(filePath: string, originalName: string): Promise<string> {
    // For now, return a placeholder description
    // TODO: Implement AI vision analysis using OpenRouter's vision models
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    
    return `Image File Analysis: ${originalName}
    
File Type: Image (${path.extname(originalName).toLowerCase()})
Size: ${sizeKB} KB
Uploaded: ${new Date().toISOString()}

This is an image file that was uploaded to the composting system. 
The image likely contains visual elements such as:
- User interface screenshots
- Design mockups
- Diagrams or flowcharts
- Code screenshots
- Documentation visuals

To extract meaningful components from this image, AI vision analysis would be needed to:
1. Identify UI components and patterns
2. Extract any visible text or code
3. Analyze design elements and layouts
4. Suggest reusable visual patterns

Note: Full image analysis requires AI vision capabilities which can be implemented using OpenRouter's vision models.`;
  }

  // Chunk content into reusable components using AI
  async chunkIntoComponents(processedFiles: ProcessedFile[], projectDescription: string): Promise<ComponentChunk[]> {
    // This will be implemented with OpenAI integration
    // For now, return a basic chunking based on content structure
    const chunks: ComponentChunk[] = [];
    
    for (const file of processedFiles) {
      const fileChunks = this.basicChunking(file, projectDescription);
      chunks.push(...fileChunks);
    }

    return chunks;
  }

  // Basic content chunking (will be enhanced with AI)
  private basicChunking(file: ProcessedFile, projectDescription: string): ComponentChunk[] {
    const chunks: ComponentChunk[] = [];
    const content = file.content;
    
    // Split content into logical sections
    const sections = this.splitIntoSections(content);
    
    sections.forEach((section, index) => {
      if (section.trim().length > 100) { // Only process substantial sections
        chunks.push({
          id: `${file.id}_chunk_${index}`,
          title: this.extractSectionTitle(section) || `Section ${index + 1} from ${file.originalName}`,
          content: section.trim(),
          type: this.inferContentType(section),
          tags: this.extractTags(section, projectDescription),
          reusabilityScore: this.calculateReusabilityScore(section),
          dependencies: this.extractDependencies(section)
        });
      }
    });

    return chunks;
  }

  // Split content into logical sections
  private splitIntoSections(content: string): string[] {
    // Split by common section markers
    const sectionMarkers = [
      /\n#{1,6}\s+/g, // Markdown headers
      /\n\n[A-Z][A-Z\s]{10,}\n/g, // ALL CAPS headers
      /\n\d+\.\s+/g, // Numbered sections
      /\n[-=]{3,}\n/g, // Horizontal rules
      /\n\n(?=[A-Z])/g // New paragraphs starting with capital letters
    ];

    let sections = [content];
    
    for (const marker of sectionMarkers) {
      const newSections: string[] = [];
      for (const section of sections) {
        newSections.push(...section.split(marker));
      }
      sections = newSections;
    }

    return sections.filter(section => section.trim().length > 0);
  }

  // Extract section title from content
  private extractSectionTitle(content: string): string | null {
    const lines = content.split('\n');
    for (const line of lines.slice(0, 3)) { // Check first 3 lines
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100) {
        // Remove markdown formatting
        return trimmed.replace(/^#+\s*/, '').replace(/[*_`]/g, '');
      }
    }
    return null;
  }

  // Infer content type based on content analysis
  private inferContentType(content: string): ComponentChunk['type'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('function') || lowerContent.includes('class') || 
        lowerContent.includes('import') || lowerContent.includes('const ') ||
        lowerContent.includes('def ') || lowerContent.includes('public ')) {
      return 'code';
    }
    
    if (lowerContent.includes('config') || lowerContent.includes('setting') ||
        lowerContent.includes('.json') || lowerContent.includes('.yaml') ||
        lowerContent.includes('environment')) {
      return 'configuration';
    }
    
    if (lowerContent.includes('design') || lowerContent.includes('ui') ||
        lowerContent.includes('interface') || lowerContent.includes('mockup') ||
        lowerContent.includes('wireframe')) {
      return 'design';
    }
    
    if (lowerContent.includes('how to') || lowerContent.includes('guide') ||
        lowerContent.includes('documentation') || lowerContent.includes('readme') ||
        lowerContent.includes('install')) {
      return 'documentation';
    }
    
    return 'other';
  }

  // Extract relevant tags from content
  private extractTags(content: string, projectDescription: string): string[] {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();
    const lowerDescription = projectDescription.toLowerCase();
    
    // Technology tags
    const techKeywords = ['react', 'node', 'python', 'javascript', 'typescript', 'api', 'database', 'frontend', 'backend'];
    techKeywords.forEach(tech => {
      if (lowerContent.includes(tech) || lowerDescription.includes(tech)) {
        tags.push(tech);
      }
    });
    
    // Functional tags
    const functionalKeywords = ['authentication', 'validation', 'testing', 'deployment', 'security', 'performance'];
    functionalKeywords.forEach(func => {
      if (lowerContent.includes(func)) {
        tags.push(func);
      }
    });
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Calculate reusability score (0-100)
  private calculateReusabilityScore(content: string): number {
    let score = 50; // Base score
    
    // Increase score for well-structured content
    if (content.includes('function') || content.includes('class')) score += 20;
    if (content.includes('export') || content.includes('module')) score += 15;
    if (content.includes('interface') || content.includes('type')) score += 10;
    
    // Increase score for documentation
    if (content.includes('/**') || content.includes('//')) score += 10;
    if (content.includes('README') || content.includes('guide')) score += 15;
    
    // Decrease score for very specific content
    if (content.includes('localhost') || content.includes('127.0.0.1')) score -= 10;
    if (content.includes('TODO') || content.includes('FIXME')) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }

  // Extract dependencies from content
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract import statements
    const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const dep = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
        if (dep && !dep.startsWith('.')) {
          dependencies.push(dep);
        }
      });
    }
    
    // Extract require statements
    const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g);
    if (requireMatches) {
      requireMatches.forEach(match => {
        const dep = match.match(/require\(['"]([^'"]+)['"]\)/)?.[1];
        if (dep && !dep.startsWith('.')) {
          dependencies.push(dep);
        }
      });
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
  }

  // Utility methods
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  // Clean up uploaded files
  async cleanupFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}

export default FileProcessorService; 