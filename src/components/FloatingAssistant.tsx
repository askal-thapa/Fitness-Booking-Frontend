"use client";

import React, { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  time: string;
};

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        sender: 'assistant',
        content: 'Hello! I am your AI Fitness Assistant. How can I help you elevate your fitness journey today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        content: 'I can certainly help with that. Could you provide a bit more detail so I can give you the best advice?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Panel */}
      <div
        className={`bg-white w-[350px] sm:w-[380px] rounded-2xl shadow-xl border border-cream-darker flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right mb-4 ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto translate-y-0 h-[500px]' : 'scale-90 opacity-0 pointer-events-none translate-y-8 h-0'
        }`}
      >
        {/* Header */}
        <div className="bg-cream-dark p-5 flex items-center justify-between shrink-0 border-b border-cream-darker">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h3 className="text-warm-dark font-semibold tracking-tight text-sm">AI Assistant</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-warm-gray hover:text-warm-dark transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 bg-cream/50 space-y-4"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-sm shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-white text-warm-dark border border-cream-darker rounded-bl-none'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-[10px] mt-2 ${
                    msg.sender === 'user' ? 'text-white/60 text-right' : 'text-warm-gray/60'
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-cream-darker shrink-0">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="w-full bg-cream border border-cream-darker text-warm-dark text-sm rounded-xl pl-4 pr-12 py-3 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-warm-gray/40"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputValue.trim()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-cream-dark text-warm-dark border border-cream-darker' : 'bg-primary text-white shadow-primary/20'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>
    </div>
  );
}
