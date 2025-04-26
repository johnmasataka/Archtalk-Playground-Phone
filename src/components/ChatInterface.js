import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store';
import './ChatInterface.css';

const ChatInterface = () => {
  const { messages, sendMessage, isLoadingChat } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [typingMessages, setTypingMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingMessages]);

  // Handle typing effect for new messages
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const latestMessage = messages[messages.length - 1];
      
      const messageExists = typingMessages.some(m => m.id === messages.length - 1);
      
      if (!messageExists) {
        const newTypingMessage = {
          id: messages.length - 1,
          role: latestMessage.role,
          content: '',
          fullContent: latestMessage.content,
          currentIndex: 0,
          isComplete: false
        };
        
        setTypingMessages(prev => [...prev.filter(m => m.id !== newTypingMessage.id), newTypingMessage]);
      }
    }
  }, [messages]);

  // Typing effect timer
  useEffect(() => {
    const incompleteMessages = typingMessages.filter(msg => !msg.isComplete);
    
    if (incompleteMessages.length > 0) {
      const typingInterval = setInterval(() => {
        setTypingMessages(prevTypingMessages => {
          return prevTypingMessages.map(msg => {
            if (!msg.isComplete) {
              const nextIndex = msg.currentIndex + 1;
              const nextChar = msg.fullContent[msg.currentIndex];
              
              if (nextIndex > msg.fullContent.length) {
                return { ...msg, isComplete: true };
              }
              
              return {
                ...msg,
                content: msg.content + nextChar,
                currentIndex: nextIndex
              };
            }
            return msg;
          });
        });
      }, 10); // Slightly faster typing speed for mobile
      
      return () => clearInterval(typingInterval);
    }
  }, [typingMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoadingChat) {
      // Use static model response instead of API
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  // Get typing message by ID
  const getTypingMessage = (index, message) => {
    const typingMsg = typingMessages.find(m => m.id === index);
    
    if (typingMsg && message.role === 'assistant') {
      return typingMsg.content;
    }
    
    return message.content;
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-container ${message.role === 'user' ? 'user-container' : 'system-container'}`}
          >
            {message.role !== 'user' && (
              <div className="avatar system-avatar">AI</div>
            )}
            <div
              className={`message ${message.role === 'user' ? 'user-message' : 'system-message'}`}
            >
              {getTypingMessage(index, message)}
            </div>
            {message.role === 'user' && (
              <div className="avatar user-avatar">You</div>
            )}
          </div>
        ))}
        {isLoadingChat && (
          <div className="message-container system-container">
            <div className="avatar system-avatar">AI</div>
            <div className="message system-message">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoadingChat}
          />
          <button type="submit" disabled={isLoadingChat || !inputValue.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 