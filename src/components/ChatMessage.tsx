'use client';

import Image from 'next/image';

interface ChatMessageProps {
  sender: string;
  message: string;
  timestamp: Date;
  isUser: boolean;
}

export default function ChatMessage({ sender, message, timestamp, isUser }: ChatMessageProps) {
  const getSenderAvatar = (sender: string): string => {
    switch (sender.toLowerCase()) {
      case 'father':
        return '/images/father.png';
      case 'mother':
        return '/images/mother.png';
      case 'daughter':
        return '/images/daughter.png';
      case 'son':
        return '/images/son.png';
      default:
        return '';
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <Image
          src={getSenderAvatar(sender)}
          alt="Sender Avatar"
          width={80}
          height={80}
          className="w-8 h-8 rounded-full mr-2"
        />
      )}

      <div className={`max-w-[80%] rounded-lg p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
        <div className="text-xs font-semibold mb-1">{sender}</div>
        <div className="text-sm">{message}</div>
        <div className="text-xs opacity-70 mt-1">{timestamp.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
