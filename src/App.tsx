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

  // Set document title
  React.useEffect(() => {
    document.title = 'Room of Requirements';
  }, []);

  // Check if we should show admin dashboard based on URL
  React.useEffect(() => {
    if (location.pathname === '/admin' && process.env.NODE_ENV === 'development') {
      setCurrentView('admin');
    }
  }, [location.pathname]);

  const handleEnterRoom = (messages: Message[]) => {
    setConversationMessages(messages);
    
    // Check if the conversation is about finding existing components
    const isComponentSearch = messages.some(msg => {
      const content = msg.content.toLowerCase();
      return content.includes('find an existing component') || 
             content.includes('find existing component') ||
             content.includes('looking for component') ||
             content.includes('search for component') ||
             content.includes('existing solution') ||
             content.includes('reusable component') ||
             content.includes('marketplace');
    });

    if (isComponentSearch) {
      // Extract meaningful keywords from the conversation for marketplace search
      const userMessages = messages.filter(msg => msg.role === 'user');
      
      // Extract meaningful keywords, excluding generic search phrases
      const meaningfulKeywords = userMessages
        .map(msg => {
          let content = msg.content.toLowerCase();
          
          // Remove generic search phrases
          const genericPhrases = [
            'find an existing component',
            'find existing component', 
            'looking for component',
            'search for component',
            'existing solution',
            'reusable component',
            'marketplace'
          ];
          
          genericPhrases.forEach(phrase => {
            content = content.replace(phrase, '');
          });
          
          // Remove common filler words and adjectives but keep important nouns
          const fillerWords = [
            // Articles and prepositions
            'some', 'the', 'a', 'an', 'and', 'but', 'with', 'for', 'my', 'your', 'our', 'their',
            // Adjectives that don't add meaning
            'nice', 'good', 'great', 'cool', 'awesome', 'amazing', 'beautiful', 'pretty', 'lovely', 'wonderful',
            'looking', 'modern', 'clean', 'simple', 'basic', 'advanced', 'professional', 'sleek', 'elegant',
            // Generic terms
            'app', 'application', 'project', 'website', 'system', 'thing', 'stuff', 'component', 'element'
          ];
          fillerWords.forEach(word => {
            content = content.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
          });
          
          return content.trim();
        })
        .filter(content => content.length > 0)
        .join(' ')
        .trim();

      // Extract and prioritize important technical terms
      const importantTerms = [
        'ui', 'interface', 'dashboard', 'form', 'chart', 'table', 'modal', 'navigation', 'nav',
        'auth', 'authentication', 'login', 'signup', 'payment', 'checkout', 'cart', 'search',
        'filter', 'button', 'input', 'dropdown', 'menu', 'sidebar', 'header', 'footer',
        'card', 'list', 'grid', 'calendar', 'date', 'picker', 'slider', 'toggle', 'switch',
        'notification', 'alert', 'toast', 'popup', 'tooltip', 'badge', 'avatar', 'profile',
        'upload', 'file', 'image', 'video', 'audio', 'player', 'editor', 'text', 'rich',
        'api', 'database', 'backend', 'frontend', 'react', 'vue', 'angular', 'node', 'express'
      ];

      // Find important terms in the meaningful keywords
      const foundTerms = meaningfulKeywords.split(' ').filter(word => 
        importantTerms.includes(word.toLowerCase())
      );

      // Use found important terms, or fall back to meaningful keywords, or default
      const searchQuery = foundTerms.length > 0 ? foundTerms.join(' ') : 
                         meaningfulKeywords || 'ui components';
      navigate(`/marketplace?chatSearch=${encodeURIComponent(searchQuery)}`);
    } else {
      // Regular room entry for project building
      setCurrentView('dashboard');
    }
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