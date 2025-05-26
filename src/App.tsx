import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import RoomDashboard from './components/RoomDashboard';
import CompostingDashboard from './components/CompostingDashboard';
import AdminDashboard from './components/AdminDashboard';
import TaskMasterPage from './pages/TaskMasterPage';
import MarketplacePage from './pages/MarketplacePage';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  useCase?: 'general' | 'research' | 'quick';
}

// Main App Component with Router
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<'chat' | 'dashboard' | 'compost' | 'admin'>('chat');
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);

  // Check if we should show admin dashboard based on URL
  React.useEffect(() => {
    if (location.pathname === '/admin' && process.env.NODE_ENV === 'development') {
      setCurrentView('admin');
    }
  }, [location.pathname]);

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

// Router Wrapper
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/taskmaster" element={<TaskMasterPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App 