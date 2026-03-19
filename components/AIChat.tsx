
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateChatResponse } from '../services/geminiService';
import { ChatMessage } from '../types';
import { MessageSquare, Send, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const AIChat: React.FC = () => {
  const { t, selectedUnit, selectedCourse, language, userApiKey, setShowSettings } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!userApiKey) {
      alert("Error: No API Key. Please add your API key in settings.");
      setShowSettings(true);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const context = selectedUnit 
      ? `Course: ${selectedCourse?.name}, Unit: ${selectedUnit.title}, Content: ${selectedUnit.content.substring(0, 100)}...`
      : "General Programming";

    // Pass language and API Key to generateChatResponse
    const responseText = await generateChatResponse(userApiKey, messages, userMsg.text, context, language);
    
    const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-xl shadow-blue-500/40 flex items-center justify-center text-white hover:scale-110 transition-transform z-40 active:scale-95"
      >
        <Sparkles size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-full md:w-[450px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl z-40 flex flex-col transition-all duration-300 border border-gray-100 dark:border-gray-800 overflow-hidden ${isMinimized ? 'h-[70px]' : 'h-[650px] max-h-[85vh]'}`}>
      
      {/* Header */}
      <div className="h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800 absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm dark:text-white">{t('ai_tutor')}</h3>
            {!isMinimized && <p className="text-[10px] text-green-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-50 animate-pulse"/> Online</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={toggleChat} className="p-2 text-gray-400 hover:text-red-500">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {!isMinimized && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pt-20 pb-4 space-y-4 bg-gray-50/50 dark:bg-black/20">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-20 p-6">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">{t('type_message')}</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                }`}>
                  <div className={`prose prose-sm dark:prose-invert max-w-none 
                      ${msg.role === 'user' ? 'prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white' : ''}
                    `}>
                    <ReactMarkdown 
                      components={{
                        code: ({node, inline, className, children, ...props}: any) => {
                          // Check for multi-line content
                          const content = String(children).replace(/\n$/, '');
                          const isMultiLine = content.includes('\n');

                          if (inline || !isMultiLine) {
                            return (
                              <code className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[0.9em] font-mono border border-indigo-100 dark:border-indigo-800/50 align-middle" {...props}>
                                {children}
                              </code>
                            )
                          }
                          // Reuse macOS window style in chat
                          return (
                            <div className="my-2 rounded-lg overflow-hidden shadow-lg bg-[#1e1e1e] border border-gray-700/50 text-left">
                               <div className="flex items-center gap-1.5 px-3 py-2 bg-[#2d2d2d] border-b border-gray-700/50">
                                 <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                                 <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                                 <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                               </div>
                               <div className="p-3 overflow-x-auto">
                                 <code className="font-mono text-xs text-gray-200 leading-relaxed" {...props}>
                                   {children}
                                 </code>
                               </div>
                             </div>
                          )
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('type_message')}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-full py-3.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
