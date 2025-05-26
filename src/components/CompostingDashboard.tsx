import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, MessageCircle, Sparkles, X, CheckCircle, AlertCircle, Loader2, Wand2 } from 'lucide-react';
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
}

const CompostingDashboard: React.FC<CompostingDashboardProps> = ({ onBackToChat }) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'describe' | 'process' | 'review'>('upload');
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
                      // Could navigate to marketplace or show success message
                      alert('Components successfully added to the ecosystem!');
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


      </div>
    </div>
  );
};

export default CompostingDashboard; 