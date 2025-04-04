'use client';

interface ChatMessageProps {
  sender: string;
  message: string;
  timestamp: Date;
  isUser: boolean;
}

export default function ChatMessage({ sender, message, timestamp, isUser }: ChatMessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
        <div className="text-xs font-semibold mb-1">{sender}</div>
        <div className="text-sm">{message}</div>
        <div className="text-xs opacity-70 mt-1">
          {timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
} 