import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am Sakshi AI, your corporate billing and payroll assistant. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Cooldown in seconds
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages update or assistant is thinking
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const sendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading || cooldown > 0) return;

    setError('');
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    
    if (!textToSend) {
      setInput('');
    }
    
    setLoading(true);
    setCooldown(3); // Apply 3-second cooldown on frontend to prevent spamming

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/chat`, {
        messages: [...messages, userMessage]
      });

      const aiReply = response.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
    } catch (err) {
      console.error('Error in AI Copilot Chat:', err);
      const errMsg = err.response?.data?.error || 'Failed to send message. Please try again.';
      setError(errMsg);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${errMsg}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const suggestions = [
    'Draft an invoice email',
    'Explain CGST vs SGST',
    'How do I add a new employee?',
    'Help with salary slip advances'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-300 relative group"
          title="Open AI Assistant"
        >
          {/* Subtle pulsating outer ring */}
          <span className="absolute inset-0 rounded-full bg-indigo-600 dark:bg-violet-600 opacity-20 animate-ping group-hover:animate-none"></span>
          
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Drawer Interface */}
      {isOpen && (
        <div className="flex flex-col w-[350px] sm:w-[380px] h-[500px] sm:h-[550px] bg-white/95 dark:bg-[#181622]/95 backdrop-blur-md border border-slate-200 dark:border-[#2b263e] shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-indigo-600 dark:bg-[#201d2c] border-b border-indigo-700/20 dark:border-[#2b263e] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm animate-pulse">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight">Sakshi AI Copilot</h3>
                <span className="text-[10px] text-indigo-200 dark:text-[#a59ebf] font-semibold">Secure Helper</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-[#2e2a3f] transition duration-200"
              title="Close chat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/40 dark:bg-[#110f18]/30 scrollbar-thin">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 dark:bg-violet-600 text-white rounded-tr-none font-medium shadow-md'
                      : 'bg-white dark:bg-[#201d2c] text-slate-800 dark:text-gray-100 border border-slate-100 dark:border-[#2b263e] rounded-tl-none font-normal shadow-sm whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#201d2c] text-slate-400 dark:text-gray-400 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100 dark:border-[#2b263e] text-xs flex gap-1.5 items-center shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Cooldown / Rate Limit Banner */}
          {cooldown > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold text-center py-1.5 border-t border-amber-100 dark:border-amber-950/30 animate-pulse">
              Anti-spam cooldown: Wait {cooldown}s before next query
            </div>
          )}

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-[#2b263e] bg-slate-50/20 dark:bg-[#110f18]/10">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(sug)}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-violet-400 hover:text-white dark:hover:text-white hover:bg-indigo-600 dark:hover:bg-violet-600 border border-indigo-200 dark:border-[#38324e] rounded-full px-2.5 py-1.5 transition duration-150"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input */}
          <div className="px-4 py-3 bg-white dark:bg-[#181622] border-t border-slate-100 dark:border-[#2b263e] flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading || cooldown > 0}
              placeholder={cooldown > 0 ? 'Waiting for cooldown...' : 'Ask about GST, payroll, or emails...'}
              className="flex-grow text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-[#110f18] border border-slate-200 dark:border-[#2c273e] text-slate-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-violet-500 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading || cooldown > 0}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white shadow disabled:opacity-40 transition duration-200 shrink-0"
              title="Send message"
            >
              <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AICopilot;
