import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import RoomDashboard from './components/RoomDashboard';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  useCase?: 'general' | 'research' | 'quick';
}

function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'dashboard'>('chat');
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);

  const handleEnterRoom = (messages: Message[]) => {
    setConversationMessages(messages);
    setCurrentView('dashboard');
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {currentView === 'chat' ? (
        <ChatInterface 
          onEnterRoom={handleEnterRoom}
          existingMessages={conversationMessages}
        />
      ) : (
        <RoomDashboard 
          messages={conversationMessages}
          onBackToChat={handleBackToChat}
        />
      )}
    </div>
  );
}

export default App 