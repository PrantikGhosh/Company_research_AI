import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import '../styles/ChatInterface.css';

const ChatInterface = ({ onMessage, isLoading, messages }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <MessageSquare size={24} />
        <h2>Company Research Assistant</h2>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>👋 Welcome to Company Research Assistant</h3>
            <p>I can help you research companies and generate comprehensive account plans.</p>
            <div className="example-prompts">
              <p>Try asking:</p>
              <ul>
                <li>"Research Microsoft"</li>
                <li>"Tell me about Apple's market position"</li>
                <li>"Generate an account plan for Tesla"</li>
              </ul>
            </div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              {msg.timestamp && (
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <Loader2 className="spinning" size={16} />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about a company or request an account plan..."
          rows="1"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? (
            <Loader2 className="spinning" size={20} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
