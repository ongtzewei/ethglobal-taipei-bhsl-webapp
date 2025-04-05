'use client';

import Image from 'next/image';

interface ChatMessageProps {
  senderRole: 'user' | 'father' | 'mother' | 'sister' | 'brother';
  senderName: string;
  message: string;
  timestamp: Date;
  isUser: boolean;
}

export default function ChatMessage({ senderRole, senderName, message, timestamp, isUser }: ChatMessageProps) {
  const getSenderAvatar = (senderRole: string): string => {
    switch (senderRole) {
      case 'father':
        return '/images/father.png';
      case 'mother':
        return '/images/mother.png';
      case 'sister':
        return '/images/sister.png';
      case 'brother':
        return '/images/brother.png';
      default:
        return '';
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <Image
          src={getSenderAvatar(senderRole)}
          alt={`${senderRole}-avatar`}
          width={80}
          height={80}
          className="w-8 h-8 rounded-full mr-2"
        />
      )}

      <div className={`max-w-[80%] rounded-lg p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
        <div className="text-xs font-semibold mb-1">{senderName}</div>
        <div className="text-sm text-wrap">{message}</div>
        <div className="text-xs opacity-70 mt-1">{timestamp.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
