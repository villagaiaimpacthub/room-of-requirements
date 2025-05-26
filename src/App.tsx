import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import RoomDashboard from './components/RoomDashboard';
import CompostingDashboard from './components/CompostingDashboard';
import AdminDashboard from './components/AdminDashboard';
import TaskProgressDashboard from './components/TaskProgressDashboard';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  useCase?: 'general' | 'research' | 'quick';
}

function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'dashboard' | 'compost' | 'admin'>('chat');
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isTaskDashboardOpen, setIsTaskDashboardOpen] = useState(false);

  // Check if we should show admin dashboard based on URL
  React.useEffect(() => {
    if (window.location.pathname === '/admin' && process.env.NODE_ENV === 'development') {
      setCurrentView('admin');
    }
  }, []);

  const handleEnterRoom = (messages: Message[]) => {
    setConversationMessages(messages);
    setCurrentView('dashboard');
  };

  const handleEnterCompost = () => {
    setCurrentView('compost');
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Task Progress Dashboard Button - Always visible */}
      <button
        onClick={() => setIsTaskDashboardOpen(true)}
        className="fixed top-4 right-4 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="font-medium">TaskMaster</span>
      </button>

      {currentView === 'chat' ? (
        <ChatInterface 
          onEnterRoom={handleEnterRoom}
          onEnterCompost={handleEnterCompost}
          existingMessages={conversationMessages}
        />
      ) : currentView === 'dashboard' ? (
        <RoomDashboard 
          messages={conversationMessages}
          onBackToChat={handleBackToChat}
        />
      ) : currentView === 'compost' ? (
        <CompostingDashboard 
          onBackToChat={handleBackToChat}
        />
      ) : (
        <AdminDashboard />
      )}

      {/* Task Progress Dashboard Modal */}
      <TaskProgressDashboard 
        isOpen={isTaskDashboardOpen}
        onClose={() => setIsTaskDashboardOpen(false)}
      />
    </div>
  );
}

export default App 