import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/chat.css';
import { toast } from 'react-hot-toast';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('isDarkMode');
    return savedMode === 'true';
  });
  const messagesEndRef = useRef(null);
  const socket = useRef(null);
  const typingTimeout = useRef(null);
  const { jobId } = useParams();
  const navigate = useNavigate();

  // Initialize dark mode on component mount
  useEffect(() => {
    const savedMode = localStorage.getItem('isDarkMode') === 'true';
    setIsDarkMode(savedMode);
    document.documentElement.classList.toggle('dark-mode', savedMode);
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  // Initialize socket and chat
  useEffect(() => {
    if (!user || !jobId) return;

    // Initialize socket with optimized settings
    socket.current = io(`${import.meta.env.VITE_BASE_URL}`, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      upgrade: false,
      forceNew: true,
      timeout: 20000,
      autoConnect: true
    });

    // Join the chat room
    socket.current.emit('join-chat', jobId);

    // Socket event handlers
    const handleNewMessage = (data) => {
      if (data.jobId === jobId) {
        setMessages(prev => {
          const messageExists = prev.some(msg => msg._id === data.message._id);
          if (!messageExists) {
            return [...prev, data.message];
          }
          return prev;
        });
      }
    };

    const handleTyping = (data) => {
      if (data.jobId === jobId && data.userId !== user._id) {
        setOtherUserTyping(true);
        setTimeout(() => setOtherUserTyping(false), 2000);
      }
    };

    const handleMessageRead = (data) => {
      if (data.jobId === jobId) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId ? { ...msg, read: true } : msg
        ));
      }
    };

    socket.current.on('new-message', handleNewMessage);
    socket.current.on('typing', handleTyping);
    socket.current.on('message-read', handleMessageRead);
    socket.current.on('connect', () => console.log('Socket connected'));
    socket.current.on('disconnect', () => console.log('Socket disconnected'));
    socket.current.on('error', (error) => console.error('Socket error:', error));

    // Fetch chat history with caching
    const fetchChat = async () => {
      try {
        const token = localStorage.getItem('token');
        const cachedChat = localStorage.getItem(`chat_${jobId}`);
        
        if (cachedChat) {
          const parsedChat = JSON.parse(cachedChat);
          setChat(parsedChat);
          setMessages(parsedChat.messages);
          setLoading(false);
        }

        const response = await axios.get(`https://gigplatform.onrender.com/chat/job/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setChat(response.data);
        setMessages(response.data.messages);
        localStorage.setItem(`chat_${jobId}`, JSON.stringify(response.data));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chat:', error);
        setLoading(false);
      }
    };

    fetchChat();

    return () => {
      if (socket.current) {
        socket.current.off('new-message');
        socket.current.off('typing');
        socket.current.off('message-read');
        socket.current.off('connect');
        socket.current.off('disconnect');
        socket.current.off('error');
        socket.current.disconnect();
      }
    };
  }, [jobId, user]);

  // Optimize scroll behavior
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    socket.current.emit('typing', { jobId, userId: user._id });
    setIsTyping(true);

    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [jobId, user]);

  // Optimize message sending
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Optimistic update
    const optimisticMessage = {
      _id: Date.now().toString(), // Temporary ID
      content: messageContent,
      sender: user,
      timestamp: new Date(),
      read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://gigplatform.onrender.com/chat/job/${jobId}/message`,
        { content: messageContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newMessageData = response.data.messages[response.data.messages.length - 1];
      
      // Replace optimistic message with real message
      setMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticMessage._id ? newMessageData : msg
        )
      );

      socket.current.emit('send-message', {
        jobId,
        message: newMessageData,
        senderId: user._id
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      setNewMessage(messageContent); // Restore message in input
      toast.error('Failed to send message');
    }
  }, [jobId, newMessage, user]);

  // Handle enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  // Memoize other user info
  const otherUser = useMemo(() => {
    if (!chat || !user) return null;
    return user.role === 'employer' ? chat.freelancer : chat.employer;
  }, [chat, user]);

  if (loading || !user) {
    return <div className={`chat-loading ${isDarkMode ? 'dark-mode' : ''}`}>Loading chat...</div>;
  }

  if (!chat) {
    return <div className={`chat-error ${isDarkMode ? 'dark-mode' : ''}`}>Chat not found</div>;
  }

  return (
    <div className={`chat-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <img
          src={`${otherUser.profileImage || 'default.png'}`}
          alt={otherUser.name}
          className="chat-avatar"
        />
        <div className="chat-header-info">
          <h3>{otherUser.name}</h3>
          <p>{chat.job.title}</p>
          {otherUserTyping && <span className="typing-indicator">typing...</span>}
        </div>
        <button className="dark-mode-toggle" onClick={() => {
          const newMode = !isDarkMode;
          setIsDarkMode(newMode);
          localStorage.setItem('isDarkMode', newMode);
          document.documentElement.classList.toggle('dark-mode', newMode);
        }}>
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${message.sender._id === user._id ? 'sent' : 'received'}`}
          >
            <img
              src={`${otherUser.profileImage || 'default.png'}`}
              alt={message.sender.name}
              className="message-avatar"
            />
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
                {message.sender._id === user._id && (
                  <span className="message-status">
                    {message.read ? '✓✓' : '✓'}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;