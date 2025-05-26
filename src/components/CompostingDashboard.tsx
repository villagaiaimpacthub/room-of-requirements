import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  Loader2, 
  CheckCircle, 
  Sparkles, 
  MessageCircle, 
  ArrowLeft,
  Search,
  Filter,
  Star,
  Download,
  Eye,
  DollarSign,
  User,
  Calendar,
  Tag,
  TrendingUp,
  Award,
  Coins
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface CompostingDashboardProps {
  onBackToChat: () => void;
}

interface CompostingSession {
  id: string;
  projectName: string;
  status: string;
  progress: {
    filesProcessed: number;
    totalFiles: number;
    componentsExtracted: number;
    currentStep: string;
  };
}

interface ProcessedFile {
  id: string;
  originalName: string;
  size: number;
  wordCount: number;
}

interface ComponentChunk {
  id: string;
  title: string;
  type: string;
  tags: string[];
  reusabilityScore: number;
  dependencies?: string[];
  content: string;
}

interface MarketplaceItem {
  id: string;
  name: string;
  fileType: string;
  score: number;
  utility: string;
  uploader: string;
  sector: string;
  uploadDate: string;
  downloads: number;
  rating: number;
  price?: number;
  description: string;
  tags: string[];
  size: string;
}

const CompostingDashboard: React.FC<CompostingDashboardProps> = ({ onBackToChat }) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'describe' | 'process' | 'review' | 'marketplace'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [components, setComponents] = useState<ComponentChunk[]>([]);
  const [session, setSession] = useState<CompostingSession | null>(null);
  const [projectDescription, setProjectDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aiThoughts, setAiThoughts] = useState<string[]>([]);
  const [showAiThoughts, setShowAiThoughts] = useState(false);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize composting session and WebSocket connection
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Create new composting session
        const response = await fetch('http://localhost:3001/api/v1/compost/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectName: 'New Project' }),
        });

        if (!response.ok) {
          throw new Error('Failed to create composting session');
        }

        const data = await response.json();
        setSession(data.session);

        // Initialize WebSocket connection for progress updates
        const socket = io('http://localhost:3001');
        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Connected to composting WebSocket');
          socket.emit('join-conversation', data.session.id);
        });

        socket.on('composting-progress', (progressData: any) => {
          console.log('Composting progress:', progressData);
          setProgress(progressData.progress);
          setProgressMessage(progressData.message);
          
          // Add AI thinking messages to the live feed
          if (progressData.message && progressData.step !== 'error') {
            setAiThoughts(prev => [...prev, `${new Date().toLocaleTimeString()}: ${progressData.message}`].slice(-10)); // Keep last 10 messages
          }
          
          if (progressData.step === 'components_ready' && progressData.data?.components) {
            setComponents(progressData.data.components);
            setCurrentStep('review');
          }
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from composting WebSocket');
        });

      } catch (error) {
        console.error('Error initializing composting session:', error);
        setError('Failed to initialize composting session');
      }
    };

    initializeSession();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
    setError(null);
  };

  // Handle file drop
  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setUploadedFiles(files);
    setError(null);
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };

  // Upload files to backend
  const uploadFiles = async () => {
    if (!session || uploadedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`http://localhost:3001/api/v1/compost/session/${session.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload files');
      }

      const data = await response.json();
      setProcessedFiles(data.files);
      setCurrentStep('describe');

    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Update project description
  const updateDescription = async () => {
    if (!session || !projectDescription.trim()) return;

    try {
      const response = await fetch(`http://localhost:3001/api/v1/compost/session/${session.id}/description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: projectDescription }),
      });

      if (!response.ok) {
        throw new Error('Failed to update description');
      }

      setCurrentStep('process');
      extractComponents();

    } catch (error) {
      console.error('Error updating description:', error);
      setError('Failed to update project description');
    }
  };

  // Extract components using AI
  const extractComponents = async () => {
    if (!session) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Starting component extraction...');

    try {
      const response = await fetch(`http://localhost:3001/api/v1/compost/session/${session.id}/extract`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to extract components');
      }

      // Components will be set via WebSocket progress updates

    } catch (error) {
      console.error('Error extracting components:', error);
      setError('Failed to extract components');
      setIsProcessing(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToChat}
                className="w-10 h-10 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg magical-glow hover:scale-105 transition-transform duration-200"
              >
                <Wand2 className="w-5 h-5 text-amber-900" />
              </button>
              <div className="h-6 w-px bg-slate-700" />
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-amber-400" />
                <h1 className="text-xl font-semibold text-white">Project Composting</h1>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <div className={`w-2 h-2 rounded-full ${currentStep === 'upload' ? 'bg-amber-400' : 'bg-slate-600'}`} />
              <span>Upload</span>
              <div className={`w-2 h-2 rounded-full ${currentStep === 'describe' ? 'bg-amber-400' : 'bg-slate-600'}`} />
              <span>Describe</span>
              <div className={`w-2 h-2 rounded-full ${currentStep === 'process' ? 'bg-amber-400' : 'bg-slate-600'}`} />
              <span>Process</span>
              <div className={`w-2 h-2 rounded-full ${currentStep === 'review' ? 'bg-amber-400' : 'bg-slate-600'}`} />
              <span>Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {currentStep === 'upload' && (
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold text-white">Upload Your Project Files</h2>
              <p className="text-slate-400">
                Upload your project files to extract reusable components.
              </p>
            </div>

            {/* File Upload Area */}
            <div 
              className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:border-amber-400/50 transition-colors duration-300"
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-800 rounded-lg">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Drop files here</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    PDF, DOCX, TXT, MD, and images supported
                  </p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-amber-400 text-slate-900 rounded-lg font-medium hover:bg-amber-300 transition-colors duration-200"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-600/40 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Selected Files</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-slate-400 text-sm">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={uploadFiles}
                  disabled={isUploading}
                  className="w-full py-3 bg-amber-400 text-slate-900 rounded-lg font-medium hover:bg-amber-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Files</span>
                    </>
                  )}
                </button>
              </div>
            )}


          </div>
        )}

        {currentStep === 'describe' && (
          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold text-white">Describe Your Project</h2>
                <p className="text-slate-400">
                  Tell us about your project so our AI can extract meaningful components.
                </p>
              </div>

              {/* Simple Project Description Form */}
              <div className="bg-slate-900/50 rounded-xl p-6">
                <textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="I would like to create concise functional requirements for the following application:

The app is called ImgxAI and is a midjourney clone, but using OpenAI's image model.
Research midjourney to get a better understanding of the app.

My Requirements:
- It should integrate with the OpenAI APIs..."
                  className="w-full h-96 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                />
                
                <div className="flex items-center justify-between mt-4">
                  <p className="text-slate-400 text-sm">
                    {projectDescription.length}/1000 characters
                  </p>
                  <button
                    onClick={updateDescription}
                    disabled={!projectDescription.trim() || projectDescription.length > 1000}
                    className="px-6 py-2 bg-amber-400 text-slate-900 rounded-lg font-medium hover:bg-amber-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Process Files
                  </button>
                </div>
              </div>
            </div>

            {/* Tips Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-blue-900/20 border border-blue-600/40 rounded-xl p-4 sticky top-4">
                <h4 className="text-blue-200 font-medium mb-3 flex items-center">
                  💡 Tips for better extraction
                </h4>
                <ul className="text-blue-200/80 text-sm space-y-2">
                  <li>• Mention the main technologies and frameworks used</li>
                  <li>• Describe the project's architecture and structure</li>
                  <li>• Highlight any reusable patterns or utilities</li>
                  <li>• Note any specific coding standards or conventions</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'process' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/10 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Processing Your Project</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Our AI is analyzing your files and extracting reusable components...
              </p>
            </div>

            {/* Real-time Progress */}
            <div className="bg-slate-900/50 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{progressMessage || 'Analyzing content...'}</span>
                  <span className="text-amber-400">{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* AI Thinking Window */}
            {aiThoughts.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-medium text-white">AI Analysis Feed</h3>
                  <div className="flex-1" />
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {aiThoughts.map((thought, index) => (
                      <div key={index} className="text-sm text-slate-300 font-mono">
                        {thought}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Processing Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`bg-slate-900/30 rounded-lg p-4 border-l-4 ${progress >= 25 ? 'border-amber-400' : 'border-slate-600'}`}>
                <div className="flex items-center space-x-3">
                  {progress >= 25 ? (
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  )}
                  <div>
                    <h4 className="text-white font-medium">File Analysis</h4>
                    <p className="text-slate-400 text-sm">Extracting content structure</p>
                  </div>
                </div>
              </div>

              <div className={`bg-slate-900/30 rounded-lg p-4 border-l-4 ${progress >= 70 ? 'border-amber-400' : 'border-slate-600'}`}>
                <div className="flex items-center space-x-3">
                  {progress >= 70 ? (
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                  ) : progress >= 25 ? (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-600" />
                  )}
                  <div>
                    <h4 className="text-white font-medium">AI Enhancement</h4>
                    <p className="text-slate-400 text-sm">Improving component quality</p>
                  </div>
                </div>
              </div>

              <div className={`bg-slate-900/30 rounded-lg p-4 border-l-4 ${progress >= 100 ? 'border-amber-400' : 'border-slate-600'}`}>
                <div className="flex items-center space-x-3">
                  {progress >= 100 ? (
                    <CheckCircle className="w-5 h-5 text-amber-400" />
                  ) : progress >= 70 ? (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-600" />
                  )}
                  <div>
                    <h4 className="text-white font-medium">Component Extraction</h4>
                    <p className="text-slate-400 text-sm">Finalizing reusable parts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-400/10 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Review Components</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Review and edit the extracted components before adding them to the ecosystem.
              </p>
            </div>

            {/* Components Summary */}
            <div className="bg-slate-900/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Extracted Components</h3>
                  <p className="text-slate-400 text-sm">
                    {components.length} reusable components found
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-400">
                    {components.length > 0 ? Math.round(components.reduce((sum, comp) => sum + comp.reusabilityScore, 0) / components.length) : 0}
                  </p>
                  <p className="text-slate-400 text-sm">Avg. Reusability</p>
                </div>
              </div>
            </div>

            {/* Components List */}
            {components.length > 0 ? (
              <div className="space-y-4">
                {components.map((component) => (
                  <div key={component.id} className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-white mb-2">{component.title}</h4>
                        <div className="flex items-center space-x-4 mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            component.type === 'code' ? 'bg-blue-900/40 text-blue-200' :
                            component.type === 'documentation' ? 'bg-green-900/40 text-green-200' :
                            component.type === 'configuration' ? 'bg-purple-900/40 text-purple-200' :
                            component.type === 'design' ? 'bg-pink-900/40 text-pink-200' :
                            'bg-slate-700/40 text-slate-300'
                          }`}>
                            {component.type}
                          </span>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              component.reusabilityScore >= 80 ? 'bg-green-400' :
                              component.reusabilityScore >= 60 ? 'bg-yellow-400' :
                              component.reusabilityScore >= 40 ? 'bg-orange-400' :
                              'bg-red-400'
                            }`} />
                            <span className="text-sm text-slate-400">
                              {component.reusabilityScore}% reusable
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {component.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-amber-900/30 text-amber-200 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {component.dependencies && component.dependencies.length > 0 && (
                          <div className="text-sm text-slate-400">
                            <span className="font-medium">Dependencies:</span> {component.dependencies.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Component Content Preview */}
                    <div className="bg-slate-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                        {component.content.substring(0, 500)}
                        {component.content.length > 500 && '...'}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 rounded-xl p-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <p className="text-slate-400">No components extracted yet. Processing may still be in progress.</p>
              </div>
            )}

            {/* Action Buttons */}
            {components.length > 0 && (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep('process')}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors duration-200"
                >
                  Re-process
                </button>
                <button
                  onClick={async () => {
                    if (session) {
                      await fetch(`http://localhost:3001/api/v1/compost/session/${session.id}/complete`, {
                        method: 'POST',
                      });
                      
                      // Add the newly composted components to marketplace
                      const newMarketplaceItems: MarketplaceItem[] = components.map((comp, index) => ({
                        id: `new-${comp.id}`,
                        name: comp.title,
                        fileType: comp.type,
                        score: comp.reusabilityScore,
                        utility: comp.type === 'code' ? 'Development' : comp.type === 'documentation' ? 'Documentation' : 'Configuration',
                        uploader: 'You',
                        sector: comp.type,
                        uploadDate: new Date().toLocaleDateString(),
                        downloads: 0,
                        rating: 0,
                        price: Math.floor(Math.random() * 50) + 10,
                        description: comp.content,
                        tags: comp.tags,
                        size: `${Math.floor(Math.random() * 100) + 10}KB`
                      }));
                      
                      // Add some sample marketplace items
                      const sampleItems: MarketplaceItem[] = [
                        {
                          id: 'sample-1',
                          name: 'React Authentication Hook',
                          fileType: 'code',
                          score: 92,
                          utility: 'Authentication',
                          uploader: 'DevMaster',
                          sector: 'Security',
                          uploadDate: '2024-01-15',
                          downloads: 1247,
                          rating: 4.8,
                          price: 25,
                          description: 'A comprehensive React hook for handling user authentication with JWT tokens, refresh logic, and automatic logout.',
                          tags: ['react', 'authentication', 'jwt', 'hooks'],
                          size: '15KB'
                        },
                        {
                          id: 'sample-2',
                          name: 'API Documentation Template',
                          fileType: 'documentation',
                          score: 87,
                          utility: 'Documentation',
                          uploader: 'TechWriter',
                          sector: 'Documentation',
                          uploadDate: '2024-01-10',
                          downloads: 892,
                          rating: 4.6,
                          price: 15,
                          description: 'Professional API documentation template with interactive examples, authentication guides, and error handling.',
                          tags: ['api', 'documentation', 'template', 'swagger'],
                          size: '8KB'
                        },
                        {
                          id: 'sample-3',
                          name: 'Docker Compose Configuration',
                          fileType: 'configuration',
                          score: 78,
                          utility: 'DevOps',
                          uploader: 'CloudExpert',
                          sector: 'Infrastructure',
                          uploadDate: '2024-01-08',
                          downloads: 634,
                          rating: 4.4,
                          price: 20,
                          description: 'Production-ready Docker Compose setup with Redis, PostgreSQL, and monitoring tools.',
                          tags: ['docker', 'compose', 'redis', 'postgresql'],
                          size: '5KB'
                        }
                      ];
                      
                      setMarketplaceItems([...newMarketplaceItems, ...sampleItems]);
                      setCurrentStep('marketplace');
                    }
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition-colors duration-200"
                >
                  Add to Ecosystem
                </button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'marketplace' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentStep('review')}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Review</span>
              </button>
              <div className="text-center flex-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-400/10 rounded-full mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Component Marketplace</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Your components have been successfully added to the ecosystem! Browse and discover reusable components from the community.
                </p>
              </div>
              <div className="w-24"></div> {/* Spacer for centering */}
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-slate-900/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search components..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  >
                    <option value="all">All Sectors</option>
                    <option value="code">Code</option>
                    <option value="documentation">Documentation</option>
                    <option value="configuration">Configuration</option>
                    <option value="design">Design</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Marketplace Table */}
            {marketplaceItems.length > 0 ? (
              <div className="bg-slate-900/30 rounded-lg overflow-hidden border border-slate-700/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          File Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Utility
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Uploader
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Sector
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {marketplaceItems
                        .filter(item => 
                          (selectedSector === 'all' || item.sector.toLowerCase() === selectedSector) &&
                          (searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
                        )
                        .map((item) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-slate-800/30 transition-colors duration-200 cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                item.uploader === 'You' ? 'bg-green-400' : 'bg-blue-400'
                              }`} />
                              <div>
                                <div className="text-sm font-medium text-white">{item.name}</div>
                                <div className="text-xs text-slate-400">{item.size}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              item.fileType === 'code' ? 'bg-blue-900/40 text-blue-200' :
                              item.fileType === 'documentation' ? 'bg-green-900/40 text-green-200' :
                              item.fileType === 'configuration' ? 'bg-purple-900/40 text-purple-200' :
                              item.fileType === 'design' ? 'bg-pink-900/40 text-pink-200' :
                              'bg-slate-700/40 text-slate-300'
                            }`}>
                              {item.fileType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                item.score >= 80 ? 'bg-green-400' :
                                item.score >= 60 ? 'bg-yellow-400' :
                                item.score >= 40 ? 'bg-orange-400' :
                                'bg-red-400'
                              }`} />
                              <span className="text-sm text-white font-medium">{item.score}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-300">{item.utility}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className={`text-sm ${item.uploader === 'You' ? 'text-green-400 font-medium' : 'text-slate-300'}`}>
                                {item.uploader}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-300">{item.sector}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem(item);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-400 transition-colors duration-200"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(`Donating crypto to ${item.uploader} for ${item.name}`);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-400 transition-colors duration-200"
                                title="Donate Crypto"
                              >
                                <Coins className="w-4 h-4" />
                              </button>
                              {item.price && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert(`Purchasing ${item.name} for $${item.price}`);
                                  }}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors duration-200"
                                  title={`Purchase for $${item.price}`}
                                >
                                  ${item.price}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 rounded-xl p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <p className="text-slate-400">No components found in the marketplace.</p>
              </div>
            )}

            {/* Component Detail Modal */}
            {selectedItem && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{selectedItem.name}</h3>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            selectedItem.fileType === 'code' ? 'bg-blue-900/40 text-blue-200' :
                            selectedItem.fileType === 'documentation' ? 'bg-green-900/40 text-green-200' :
                            selectedItem.fileType === 'configuration' ? 'bg-purple-900/40 text-purple-200' :
                            selectedItem.fileType === 'design' ? 'bg-pink-900/40 text-pink-200' :
                            'bg-slate-700/40 text-slate-300'
                          }`}>
                            {selectedItem.fileType}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-slate-300">{selectedItem.rating}</span>
                          </div>
                          <span className="text-sm text-slate-400">{selectedItem.downloads} downloads</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="text-slate-400 hover:text-white transition-colors duration-200"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Description</h4>
                        <p className="text-slate-400 text-sm">{selectedItem.description}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-amber-900/30 text-amber-200 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">Uploader</h4>
                          <p className="text-slate-400 text-sm">{selectedItem.uploader}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">Upload Date</h4>
                          <p className="text-slate-400 text-sm">{selectedItem.uploadDate}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">Reusability Score</h4>
                          <p className="text-slate-400 text-sm">{selectedItem.score}%</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-1">File Size</h4>
                          <p className="text-slate-400 text-sm">{selectedItem.size}</p>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={() => alert(`Donating crypto to ${selectedItem.uploader}`)}
                          className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <Coins className="w-4 h-4" />
                          Donate Crypto
                        </button>
                        {selectedItem.price && (
                          <button
                            onClick={() => alert(`Purchasing ${selectedItem.name} for $${selectedItem.price}`)}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Purchase ${selectedItem.price}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default CompostingDashboard; 