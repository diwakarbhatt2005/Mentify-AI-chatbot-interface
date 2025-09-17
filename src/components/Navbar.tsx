import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Sun, Moon, Bot, Zap, Brain, Sparkles } from 'lucide-react';
import logo from "/infinity__1_-removebg-preview.png";

interface NavbarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isDarkMode, toggleTheme, selectedModel, setSelectedModel }) => {
  const getModelDescription = (model: string) => {
    const descriptions: { [key: string]: string } = {
      'Mentify 1': 'General purpose AI assistant',
      'Mentify 2': 'Fast and efficient responses',
      'Mentify 3': 'Advanced reasoning and analysis',
      'Mentify 4': 'Creative and innovative solutions'
    };
    return descriptions[model] || 'AI Assistant';
  };

  return (
    <nav className={`${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-gray-200/50'} border-b backdrop-blur-xl transition-all duration-300 sticky top-0 z-50 safe-area-inset-top`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-16">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 hover:scale-105">
                <img 
                  src={logo} 
                  alt="Mentify Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-lg sm:text-xl font-bold bg-gradient-to-r ${isDarkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-600'} bg-clip-text text-transparent`}>
                Mentify AI
              </h1>
            </div>
            <div className="block sm:hidden">
              <h1 className={`text-sm font-bold bg-gradient-to-r ${isDarkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-600'} bg-clip-text text-transparent`}>
                Mentify AI
              </h1>
            </div>
          </div>

          {/* Current Model Display */}
          <div className="flex-1"></div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Profile */}
            <button className={`p-2 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-800/80' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}>
              <User size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800/80' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              {isDarkMode ? <Sun size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>

            {/* Logout */}
            <button className={`p-2 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-800/80' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}>
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;