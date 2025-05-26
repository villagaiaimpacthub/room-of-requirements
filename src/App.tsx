import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import RoomDashboard from './components/RoomDashboard';
import CompostingDashboard from './components/CompostingDashboard';
import AdminDashboard from './components/AdminDashboard';

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
    </div>
  );
}

export default App 