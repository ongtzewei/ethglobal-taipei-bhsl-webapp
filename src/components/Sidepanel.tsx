'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

interface Message {
  senderRole: 'user' | 'father' | 'mother' | 'sister' | 'brother';
  senderName: string;
  message: string;
  timestamp: Date;
  isUser: boolean;
}

export default function Sidepanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket(`wss://${window.location.host}/api/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      const data = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev,
        {
          senderRole: data.senderRole,
          senderName: data.senderName,
          message: data.message,
          timestamp: new Date(),
          isUser: false,
        },
      ]);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsRef.current || !inputMessage.trim()) return;

    const message = inputMessage.trim();
    setMessages((prev) => [
      ...prev,
      {
        senderRole: 'user',
        senderName: 'You',
        message,
        timestamp: new Date(),
        isUser: true,
      },
    ]);

    wsRef.current.send(JSON.stringify({ message }));
    setInputMessage('');
  };

  return (
    <Card className="w-[30%] h-[calc(100vh-4rem)] fixed right-0 top-16 flex flex-col rounded-none">
      <CardHeader className="border-b">
        <h2 className="text-lg font-semibold">🏠 Family Group Chat ❤️</h2>
        <div className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Connecting...'}</div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            senderRole={msg.senderRole}
            senderName={msg.senderName}
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
            <Button type="submit" disabled={!isConnected || !inputMessage.trim()}>
              Send
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
