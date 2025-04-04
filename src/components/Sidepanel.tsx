'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ChatMessage from './ChatMessage';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

interface Message {
  sender: string;
  message: string;
  timestamp: Date;
  isUser: boolean;
}

export default function Sidepanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    newSocket.on('agent_message', (data: { agent: string; message: string }) => {
      setMessages(prev => [...prev, {
        sender: data.agent,
        message: data.message,
        timestamp: new Date(),
        isUser: false
      }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputMessage.trim()) return;

    const message = inputMessage.trim();
    setMessages(prev => [...prev, {
      sender: 'You',
      message,
      timestamp: new Date(),
      isUser: true
    }]);

    socket.emit('user_message', { message });
    setInputMessage('');
  };

  return (
    <Card className="w-[30%] h-[calc(100vh-4rem)] fixed right-0 top-16 flex flex-col">
      <CardHeader className="border-b">
        <h2 className="text-lg font-semibold">Chat with Agents</h2>
        <div className="text-xs text-gray-500">
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            sender={msg.sender}
            message={msg.message}
            timestamp={msg.timestamp}
            isUser={msg.isUser}
          />
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      <CardFooter className="border-t p-4">
        <form onSubmit={sendMessage} className="w-full">
          <div className="flex gap-2">
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={!isConnected}
            />
            <Button
              type="submit"
              disabled={!isConnected || !inputMessage.trim()}
            >
              Send
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
} 