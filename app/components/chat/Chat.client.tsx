'use client';

import { useChat } from 'ai/react';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/Button';

export function Chat() {
  const [isClient, setIsClient] = useState(false);

  // Only render on client to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              <h2 className="text-2xl font-semibold mb-4">Start a conversation</h2>
              <p className="text-gray-600 mb-6">
                Ask me anything about your goals, projects, or strategic planning.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <p className="text-sm font-medium">💡 "Help me define my project goals"</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <p className="text-sm font-medium">🎯 "What are my strategic options?"</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <p className="text-sm font-medium">📊 "Show me my decision map"</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <p className="text-sm font-medium">🚀 "How do I get started?"</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${message.role === 'user'
                    ? 'bg-blue-50 border border-blue-200 ml-auto max-w-[80%]'
                    : 'bg-gray-50 border border-gray-200 mr-auto max-w-[80%]'
                  }`}
              >
                <div className="font-semibold mb-1 text-sm text-gray-600">
                  {message.role === 'user' ? 'You' : 'Shining AI'}
                </div>
                <div className="whitespace-pre-wrap text-gray-800">{message.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
                <span>Thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              loading={isLoading}
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
