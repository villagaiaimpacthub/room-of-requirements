import React, { useState } from 'react';
import { ArrowLeft, Upload, FileText, MessageCircle, Sparkles } from 'lucide-react';

interface CompostingDashboardProps {
  onBackToChat: () => void;
}

const CompostingDashboard: React.FC<CompostingDashboardProps> = ({ onBackToChat }) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'describe' | 'process' | 'review'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToChat}
                className="flex items-center space-x-2 text-slate-400 hover:text-amber-400 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Chat</span>
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/10 rounded-full mb-4">
                <Upload className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Compost Your Project</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Transform your project into reusable components for the ecosystem. Upload your files, 
                describe your project, and let our AI extract valuable components that others can discover and use.
              </p>
            </div>

            {/* File Upload Area */}
            <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:border-amber-400/50 transition-colors duration-300">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-800 rounded-lg">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Drop your project files here</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Support for PDF, DOCX, TXT, MD, and image files (max 50MB each)
                  </p>
                  <button className="inline-flex items-center px-4 py-2 bg-amber-400 text-slate-900 rounded-lg font-medium hover:bg-amber-300 transition-colors duration-200">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </button>
                </div>
              </div>
            </div>

            {/* Supported Formats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'PDF Documents', ext: '.pdf', icon: '📄' },
                { name: 'Word Documents', ext: '.docx', icon: '📝' },
                { name: 'Markdown Files', ext: '.md', icon: '📋' },
                { name: 'Text Files', ext: '.txt', icon: '📃' },
              ].map((format) => (
                <div key={format.ext} className="bg-slate-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">{format.icon}</div>
                  <div className="text-sm font-medium text-white">{format.name}</div>
                  <div className="text-xs text-slate-400">{format.ext}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'describe' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/10 rounded-full mb-4">
                <MessageCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Describe Your Project</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Tell us about your project so our AI can better understand and extract meaningful components.
              </p>
            </div>

            {/* Chat Interface Placeholder */}
            <div className="bg-slate-900/50 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
              <div className="text-center text-slate-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chat interface will be integrated here</p>
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

            {/* Progress Placeholder */}
            <div className="bg-slate-900/50 rounded-xl p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Analyzing content...</span>
                  <span className="text-amber-400">75%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-amber-400 h-2 rounded-full w-3/4 transition-all duration-300"></div>
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

            {/* Components Preview Placeholder */}
            <div className="bg-slate-900/50 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Component preview and editing interface will be here</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-8">
          <button
            onClick={() => {
              const steps = ['upload', 'describe', 'process', 'review'] as const;
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1]);
              }
            }}
            disabled={currentStep === 'upload'}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <button
            onClick={() => {
              const steps = ['upload', 'describe', 'process', 'review'] as const;
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex < steps.length - 1) {
                setCurrentStep(steps[currentIndex + 1]);
              }
            }}
            disabled={currentStep === 'review'}
            className="px-6 py-2 bg-amber-400 text-slate-900 rounded-lg font-medium hover:bg-amber-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 'review' ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompostingDashboard; 