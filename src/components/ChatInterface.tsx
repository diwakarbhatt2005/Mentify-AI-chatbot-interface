import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Bot, Copy, RefreshCw, Plus, Paperclip, ArrowUp, ChevronDown, Lock, Check, Zap, Brain, Sparkles, X, FileText, Image as ImageIcon, File, Edit3, Lightbulb, FileSearch, Palette, Clock } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  attachments?: {
    file: File;
    type: 'image' | 'document' | 'other';
    preview?: string;
  }[];
}

interface Buddy {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  isLocked: boolean;
  price?: string;
  description: string;
  color: string;
}

interface ChatInterfaceProps {
  isDarkMode: boolean;
  selectedModel: string;
  onNewInteraction: (title: string, summary: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isDarkMode, selectedModel, onNewInteraction }) => {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<Buddy | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{
    file: File;
    type: 'image' | 'document' | 'other';
    preview?: string;
  }[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);
  const [suggestions] = useState([
    { text: "Help me write an email", icon: Edit3 },
    { text: "Explain this concept", icon: Lightbulb },
    { text: "Create a summary", icon: FileSearch },
    { text: "Generate ideas", icon: Palette }
  ]);
  
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buddies: Buddy[] = [
    { 
      id: 'mentify-1', 
      name: 'Mentify 1', 
      icon: Bot, 
      isLocked: false, 
      description: 'General purpose AI assistant',
      color: 'text-blue-500'
    },
    { 
      id: 'mentify-2', 
      name: 'Mentify 2', 
      icon: Zap, 
      isLocked: false, 
      description: 'Fast and efficient responses',
      color: 'text-yellow-500'
    },
    { 
      id: 'mentify-3', 
      name: 'Mentify 3', 
      icon: Brain, 
      isLocked: true, 
      price: '$9.99', 
      description: 'Advanced reasoning and analysis',
      color: 'text-purple-500'
    },
    { 
      id: 'mentify-4', 
      name: 'Mentify 4', 
      icon: Sparkles, 
      isLocked: true, 
      price: '$14.99', 
      description: 'Creative and innovative solutions',
      color: 'text-pink-500'
    },
  ];

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // speech recognition reference removed (not used in this simplified implementation)
  const dragCounter = useRef<number>(0);
  const [dragCursor, setDragCursor] = useState<{ x: number; y: number } | null>(null);
  const [dragFileName, setDragFileName] = useState<string | null>(null);

  // Global drag/drop handlers: show overlay when dragging anywhere and attach files on drop
  useEffect(() => {
    const opts = { passive: false, capture: true } as AddEventListenerOptions;

    const onWindowDragEnter = (e: DragEvent) => {
      if (!e) return;
      try { e.preventDefault(); } catch {}
      dragCounter.current += 1;
      // Attempt to extract a filename for preview
      const first = e.dataTransfer?.items?.[0];
      if (first && 'getAsFile' in first) {
        try { const f = (first as any).getAsFile(); if (f) setDragFileName(f.name); } catch {}
      }
      setIsDragOver(true);
    };

    const onWindowDragOver = (e: DragEvent) => {
      if (!e) return;
      try { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; } catch {}
      // Update cursor position for floating preview
      setDragCursor({ x: e.clientX, y: e.clientY });
      setIsDragOver(true);
    };

    const onWindowDragLeave = (e: DragEvent) => {
      if (!e) return;
      try { e.preventDefault(); } catch {}
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) {
        setIsDragOver(false);
        setDragCursor(null);
        setDragFileName(null);
      }
    };

    const onWindowDrop = (e: DragEvent) => {
      if (!e) return;
      try { e.preventDefault(); e.stopPropagation(); } catch {}
      dragCounter.current = 0;
      setIsDragOver(false);
      setDragCursor(null);
      setDragFileName(null);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        handleFileSelect(files);
      }
    };

    window.addEventListener('dragenter', onWindowDragEnter, opts);
    window.addEventListener('dragover', onWindowDragOver, opts);
    window.addEventListener('dragleave', onWindowDragLeave, opts);
    window.addEventListener('drop', onWindowDrop, opts);

    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter, opts as any);
      window.removeEventListener('dragover', onWindowDragOver, opts as any);
      window.removeEventListener('dragleave', onWindowDragLeave, opts as any);
      window.removeEventListener('drop', onWindowDrop, opts as any);
    };
  }, []);

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setIsModelSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Handle file selection
  const handleFileSelect = (files: File[]) => {
    const newAttachments = files.map(file => {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text') ? 'document' : 'other';
      
      return {
        file,
        type: fileType as 'image' | 'document' | 'other'
      };
    });

    // Process image previews
    newAttachments.forEach((attachment, index) => {
      if (attachment.type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachedFiles(prev => {
            const updated = [...prev];
            const targetIndex = prev.length + index;
            if (updated[targetIndex]) {
              updated[targetIndex] = {
                ...updated[targetIndex],
                preview: e.target?.result as string
              };
            }
            return updated;
          });
        };
        reader.readAsDataURL(attachment.file);
      }
    });

    setAttachedFiles(prev => [...prev, ...newAttachments]);
  };

  // Handle file input click
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // show copy cursor
    try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; } catch {}
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  // Prevent the browser from opening files when dropped outside the app area
  useEffect(() => {
    const prevent = (e: Event) => {
      const ev = e as DragEvent;
      if (ev) {
        try { ev.preventDefault(); } catch {}
      }
    };

    // Add listeners for common drag events, with capture:true and passive:false so preventDefault is honored early
    const opts = { passive: false, capture: true } as AddEventListenerOptions;
    window.addEventListener('dragover', prevent, opts);
    window.addEventListener('drop', prevent, opts);

    return () => {
      window.removeEventListener('dragover', prevent, opts as any);
      window.removeEventListener('drop', prevent, opts as any);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const startNewChat = () => {
    setMessages([]);
    setMessage('');
    setContextualSuggestions([]);
  };

  // Helper to map file types to icons
  const getFileIcon = (type: 'image' | 'document' | 'other') => {
    if (type === 'image') return ImageIcon;
    if (type === 'document') return FileText;
    return File;
  };

  const handleModelSelect = (buddy: Buddy) => {
    // Close dropdown; selectedModel is a prop so we don't change it here
    setIsModelSelectorOpen(false);
    // Optionally, we could notify parent of selection via onNewInteraction
    try { onNewInteraction?.(buddy.name, `Switched to ${buddy.name}`); } catch {}
  };

  const handleUpgradeModalClose = () => setShowUpgradeModal(null);
  const handleUpgrade = () => {
    // Placeholder: perform upgrade action
    setShowUpgradeModal(null);
    // In real app, trigger billing flow
  };

  const handleSuggestionClick = (text: string) => {
    setMessage(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleListening = () => {
    setIsListening(prev => !prev);
  };

  const toggleSpeaking = (content?: string) => {
    // Simple TTS toggle: if already speaking, stop; otherwise speak provided content
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = content || messages.slice(-1)[0]?.content || '';
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
  };

  const generateBotResponse = (userText: string) => {
    // Minimal canned response for now
    if (!userText) return "I'm here — tell me what you need.";
    return `You said: ${userText}`;
  };

  const generateContextualSuggestions = () => {
    setContextualSuggestions([
      'Summarize this conversation',
      'Convert to email',
      'Give me bullet points'
    ]);
  };

  const handleSendMessage = () => {
    if (!message.trim() && attachedFiles.length === 0) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      attachments: attachedFiles.map(a => ({ file: a.file, type: a.type, preview: a.preview }))
    };

    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setAttachedFiles([]);

    // Simulate bot typing and response
    setIsTyping(true);
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateBotResponse(userMsg.content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      generateContextualSuggestions();
    }, 800 + Math.random() * 800);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global drag overlay: subtle, fixed to viewport, minimal text */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Small centered panel only; avoid full-screen dim so cards remain visible */}
          <div
            className={`relative pointer-events-auto flex items-center justify-center rounded-xl shadow-lg px-3 py-2`} 
            style={{
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(0,0,0,0.06)',
              maxWidth: '260px',
              width: 'min(80%, 260px)',
              background: isDarkMode ? 'rgba(31,41,55,0.6)' : 'rgba(255,255,255,0.9)'
            }}
          >
            <Paperclip size={28} className="text-blue-500 mr-2" />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Drop to attach</span>
          </div>
        </div>
      )}

      {/* Floating filename preview near cursor */}
      {isDragOver && dragCursor && dragFileName && (
        <div
          className="fixed z-[60] pointer-events-none"
          style={{ left: dragCursor.x + 12, top: dragCursor.y + 12 }}
        >
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <Paperclip size={16} className="text-blue-500" />
            <span className="max-w-[220px] truncate block">{dragFileName}</span>
          </div>
        </div>
      )}
      {/* Mobile History Overlay */}
      {isMobileHistoryOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileHistoryOpen(false)}></div>
          <div className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-r transition-colors duration-300 flex flex-col`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} h-[57px] sm:h-[73px] flex items-center`}>
              <div className="flex items-center justify-between w-full">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  History
                </h2>
                <button
                  onClick={() => setIsMobileHistoryOpen(false)}
                  className={`p-1.5 rounded-md transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <div className="p-4 text-center">
                <Clock className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} size={24} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No history yet
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className={`flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b ${
        isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
      } h-[60px] sm:h-[73px]`}>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
          }`}>
            <Bot className="text-white" size={14} />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <h2 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedModel}
                </h2>
                <button
                  onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                  className={`p-1 rounded transition-colors duration-200 ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform duration-300 ${isModelSelectorOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} 
                  />
                </button>
              </div>
              <div className={`flex items-center space-x-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-xs">Online</span>
              </div>
            </div>
          </div>
          
          <div className="relative" ref={modelSelectorRef}>
            {/* Model Selector Dropdown */}
            {isModelSelectorOpen && (
              <div className={`absolute top-full left-0 mt-2 w-80 rounded-xl border shadow-xl backdrop-blur-xl z-50 overflow-hidden ${
                isDarkMode 
                  ? 'bg-gray-800/95 border-gray-600' 
                  : 'bg-white/95 border-gray-200'
              }`}>
                <div className="p-2">
                  {buddies.map((buddy) => {
                    const IconComponent = buddy.icon;
                    const isSelected = buddy.name === selectedModel;
                    
                    return (
                      <div
                        key={buddy.id}
                        onClick={() => handleModelSelect(buddy)}
                        className={`relative p-2 rounded-xl cursor-pointer transition-all duration-200 group shadow-sm ${
                          isDarkMode 
                            ? 'hover:bg-gray-700/80' 
                            : 'hover:bg-gray-50/80'
                        } ${isSelected ? (isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50/80') : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              isDarkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-white'
                            }`}>
                              {buddy.isLocked ? (
                                <Lock size={12} className="text-gray-400" />
                              ) : (
                                <IconComponent size={12} className={buddy.color} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`font-semibold text-xs flex items-center space-x-2 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                <span>{buddy.name}</span>
                                {isSelected && !buddy.isLocked && (
                                  <Check size={10} className="text-blue-500" />
                                )}
                              </div>
                              <div className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {buddy.description}
                              </div>
                            </div>
                          </div>
                          
                          {buddy.isLocked && (
                            <div className={`text-[10px] px-2 py-1 rounded-full ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {buddy.price}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Mobile History Button */}
          <button
            onClick={() => setIsMobileHistoryOpen(true)}
            className={`lg:hidden p-2 rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="History"
          >
            <Clock size={16} />
          </button>
          <button
            onClick={startNewChat}
            className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <Plus size={16} />
            <span className="text-sm">New Chat</span>
          </button>
          <button
            onClick={startNewChat}
            className={`md:hidden p-2 rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="New Chat"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={clearChat}
            className={`p-2 rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Clear Chat"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Lock size={24} className="text-gray-400" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Upgrade to {showUpgradeModal.name}
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {showUpgradeModal.description}
              </p>
              <div className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {showUpgradeModal.price}/month
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpgradeModalClose}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div 
        className={`flex-1 ${messages.length === 0 ? 'overflow-hidden' : 'overflow-y-auto'} transition-all duration-200 relative ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        
        {messages.length === 0 ? (
          // Welcome Screen + Inline Input
          <div className="flex flex-col items-center justify-between h-full p-4 sm:p-6 lg:p-8 text-center min-h-[60vh] sm:min-h-[70vh]">
            <div className="w-full max-w-md mx-auto">
              <h1 className={`text-xl sm:text-2xl md:text-2xl font-bold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                How can I help you today?
              </h1>
              <p className={`text-sm sm:text-base mb-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
               "I'm {selectedModel}, trained to assist, designed to impress."
              </p>
            </div>
            
            {/* Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[700px] mx-auto mb-6">
              {suggestions.map((suggestion, index) => {
                const IconComponent = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className={`group p-2 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-md min-h-[48px] ${
                      isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600 shadow-sm'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-2 mb-1">
                      <div className={`p-1 rounded-md transition-colors duration-300 ${
                        isDarkMode
                          ? 'bg-gray-700 group-hover:bg-gray-600'
                          : 'bg-gray-100 group-hover:bg-blue-100'
                      }`}>
                        <IconComponent size={10} className={`transition-colors duration-300 ${
                          isDarkMode
                            ? 'text-gray-400 group-hover:text-gray-300'
                            : 'text-gray-600 group-hover:text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold">{suggestion.text}</div>
                        <div className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Click to get started
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic contextual suggestions (from recent messages) shown in welcome */}
            {contextualSuggestions.length > 0 && (
              <div className="w-full max-w-md mx-auto mb-4">
                <div className="flex justify-center gap-2">
                  {contextualSuggestions.slice(0, 2).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors duration-150 ${isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inline input area (merged with welcome) */}
            <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} w-full max-w-4xl mx-auto p-3 sm:p-4 pb-safe`}> 
              {/* Compact attachments: inline chips */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((attachedFile, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full border transition-colors duration-150 ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    >
                      {attachedFile.type === 'image' && attachedFile.preview ? (
                        <img src={attachedFile.preview} alt="Preview" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {React.createElement(getFileIcon(attachedFile.type), { size: 14, className: isDarkMode ? 'text-gray-300' : 'text-gray-600' })}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate w-40 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {attachedFile.file.name}
                        </p>
                        <p className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {(attachedFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        onClick={() => removeAttachment(index)}
                        className={`ml-2 p-1 rounded-full transition-colors duration-150 ${isDarkMode ? 'hover:bg-red-600 text-gray-300 hover:text-white' : 'hover:bg-red-500 text-gray-600 hover:text-white'}`}
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="relative flex items-center bg-transparent">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                />
                <div className={`flex items-center space-x-2 flex-1 px-2 py-2 rounded-xl border transition-colors duration-200 bg-transparent ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <button 
                    onClick={handleFileInputClick}
                    className={`p-2 rounded-lg transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}
                    title="Attach file"
                  >
                    <Paperclip size={18} />
                  </button>
                  
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className={`flex-1 resize-none bg-transparent border-none outline-none text-base ${
                      isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                    }`}
                    rows={1}
                    style={{ maxHeight: '120px', fontSize: '16px' }}
                  />
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={toggleListening}
                      className={`p-2 rounded-lg transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                        isListening
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                          : isDarkMode 
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                      }`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    
                    <button
                      onClick={handleSendMessage}
                        disabled={( !message.trim() && attachedFiles.length === 0 ) || isTyping}
                      className={`p-2 rounded-lg transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                        message.trim() && !isTyping
                          ? isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-300 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      <ArrowUp size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat Messages
          <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 flex-1">
            {messages.map((msg) => (
              <div key={msg.id} className="group">
                <div className={`flex items-start space-x-2 sm:space-x-3 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {msg.type === 'bot' && (
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-6 ${
                      isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <Bot className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} size={12} />
                    </div>
                  )}
                  
                  <div className={`flex-1 min-w-0 ${msg.type === 'user' ? 'max-w-[85%] flex flex-col items-end' : 'max-w-[85%]'}`}>
                    <div className={`flex items-center mb-1 space-x-2 ${msg.type === 'user' ? 'justify-end' : ''}`} style={{ height: '1.25rem' }}>
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {msg.type === 'user' ? 'You' : selectedModel}
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    
                    <div className={`inline-block px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${
                      msg.type === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md max-w-fit'
                        : isDarkMode 
                          ? 'bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700' 
                          : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                    }`}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {msg.attachments.map((attachment, index) => (
                            <div key={index}>
                              {attachment.type === 'image' && attachment.preview ? (
                                <img 
                                  src={attachment.preview} 
                                  alt="Attachment" 
                                  className="max-w-xs max-h-48 rounded-lg object-cover"
                                />
                              ) : (
                                <div className={`flex items-center space-x-2 p-2 rounded-lg ${
                                  msg.type === 'user' ? 'bg-white/20' : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                  {React.createElement(getFileIcon(attachment.type), { 
                                    size: 14, 
                                    className: msg.type === 'user' ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-600' 
                                  })}
                                  <span className={`text-xs ${
                                    msg.type === 'user' ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                  }`}>
                                    {attachment.file.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                    
                    {msg.isVoice && (
                      <div className={`flex items-center mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Mic size={12} className="mr-1" />
                        Voice message
                      </div>
                    )}
                    
                    {/* Message Actions */}
                    <div className={`flex items-center space-x-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                      <button
                        onClick={() => copyMessage(msg.content)}
                        className={`p-1 rounded transition-colors duration-200 min-h-[28px] min-w-[28px] flex items-center justify-center ${
                          isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                        }`}
                        title="Copy message"
                        style={{ marginTop: '2px' }}
                      >
                        <Copy size={15} />
                      </button>
                      {msg.type === 'bot' && (
                        <button
                          onClick={() => toggleSpeaking(msg.content)}
                          className={`p-1 rounded transition-colors duration-200 min-h-[28px] min-w-[28px] flex items-center justify-center ${
                            isSpeaking 
                              ? 'bg-green-500 text-white' 
                              : isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                          }`}
                          title="Read aloud"
                          style={{ marginTop: '2px' }}
                        >
                          {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="group">
                <div className="flex items-start space-x-2 sm:space-x-4">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <Bot className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} size={12} />
                  </div>
                  <div className="flex-1">
                    <div className={`flex items-center space-x-1 sm:space-x-2 mb-2`}>
                      <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedModel}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <div className={`w-2 h-2 rounded-full animate-bounce ${
                        isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                      }`} style={{ animationDelay: '0ms' }}></div>
                      <div className={`w-2 h-2 rounded-full animate-bounce ${
                        isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                      }`} style={{ animationDelay: '150ms' }}></div>
                      <div className={`w-2 h-2 rounded-full animate-bounce ${
                        isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                      }`} style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Persistent bottom input for chat view (keeps input visible after sending first message) */}
      {messages.length > 0 && (
        <div className={`p-3 sm:p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="w-full max-w-4xl mx-auto">
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((attachedFile, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full border transition-colors duration-150 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    {attachedFile.type === 'image' && attachedFile.preview ? (
                      <img src={attachedFile.preview} alt="Preview" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {React.createElement(getFileIcon(attachedFile.type), { size: 14, className: isDarkMode ? 'text-gray-300' : 'text-gray-600' })}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className={`text-xs font-medium truncate w-40 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {attachedFile.file.name}
                      </p>
                      <p className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(attachedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      onClick={() => removeAttachment(index)}
                      className={`ml-2 p-1 rounded-full transition-colors duration-150 ${isDarkMode ? 'hover:bg-red-600 text-gray-300 hover:text-white' : 'hover:bg-red-500 text-gray-600 hover:text-white'}`}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                multiple
              />
              <div className={`flex items-center space-x-2 flex-1 px-2 py-2 rounded-xl border transition-colors duration-200 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <button 
                  onClick={handleFileInputClick}
                  className={`p-2 rounded-lg transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>

                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className={`flex-1 resize-none bg-transparent border-none outline-none text-base ${
                    isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  }`}
                  rows={1}
                  style={{ maxHeight: '120px', fontSize: '16px' }}
                />

                <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleListening}
                    className={`p-2 rounded-lg transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : isDarkMode 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  <button
                    onClick={handleSendMessage}
                    disabled={( !message.trim() && attachedFiles.length === 0 ) || isTyping}
                    className={`p-2 rounded-lg transition-all duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                      message.trim() && !isTyping
                        ? isDarkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                        : isDarkMode 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-300 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatInterface;