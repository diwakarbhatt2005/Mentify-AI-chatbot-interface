import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import History from './components/History';
import ChatInterface from './components/ChatInterface';

interface HistoryItem {
  id: string;
  timestamp: string;
  model: string;
  title: string;
  summary: string;
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Mentify 1');
  const [activeChat, setActiveChat] = useState<string>('1');
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: '1',
      timestamp: '2 hours ago',
      model: 'Mentify 1',
      title: 'Welcome conversation',
      summary: 'Initial setup and introduction to the platform features and capabilities.'
    },
    {
      id: '2',
      timestamp: '1 day ago',
      model: 'Mentify 2',
      title: 'Code assistance',
      summary: 'Help with React component development and TypeScript implementation.'
    },
    {
      id: '3',
      timestamp: '2 days ago',
      model: 'Mentify 4',
      title: 'Creative writing',
      summary: 'Collaborative story writing session with character development.'
    },
    {
      id: '4',
      timestamp: '3 days ago',
      model: 'Mentify 1',
      title: 'Data analysis help',
      summary: 'Assistance with interpreting statistical data and creating visualizations.'
    },
    {
      id: '5',
      timestamp: '4 days ago',
      model: 'Mentify 3',
      title: 'Language learning',
      summary: 'Practice conversation in Spanish with grammar corrections and tips.'
    },
    {
      id: '6',
      timestamp: '5 days ago',
      model: 'Mentify 2',
      title: 'Recipe suggestions',
      summary: 'Healthy meal planning and cooking instructions for vegetarian dishes.'
    },
    {
      id: '7',
      timestamp: '1 week ago',
      model: 'Mentify 1',
      title: 'Travel planning',
      summary: 'Itinerary creation for a 2-week European vacation with budget considerations.'
    },
    {
      id: '8',
      timestamp: '1 week ago',
      model: 'Mentify 4',
      title: 'Business strategy',
      summary: 'Market analysis and competitive positioning for a new startup idea.'
    }
  ]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleNewInteraction = (title: string, summary: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: 'Just now',
      model: selectedModel,
      title,
      summary
    };
    setHistory([newItem, ...history]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleDeleteChat = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeChat === id && history.length > 1) {
      setActiveChat(history.find(item => item.id !== id)?.id || '');
    }
  };

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={`min-h-screen min-h-[100dvh] transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Navbar 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
      
      <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] relative">
        <History 
          isDarkMode={isDarkMode}
          history={history}
          activeChat={activeChat}
          onClearHistory={handleClearHistory}
          onDeleteChat={handleDeleteChat}
        />
        
        <div className="flex-1 flex flex-col">
          <ChatInterface 
            isDarkMode={isDarkMode}
            selectedModel={selectedModel}
            onNewInteraction={handleNewInteraction}
          />
        </div>
      </div>
    </div>
  );
}

export default App;