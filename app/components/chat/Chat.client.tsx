import { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  onMessageCountChange?: (count: number) => void;
}

export function Chat({ onMessageCountChange }: ChatProps = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update message count when messages change
  useEffect(() => {
    onMessageCountChange?.(messages.length);
  }, [messages.length, onMessageCountChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        // Try to parse error details from response
        let errorContent = 'Sorry, I encountered an error. Please try again.';

        try {
          const errorData = await response.json();
          const errorMsg = errorData.message || '';

          // Provide specific error messages based on error type
          if (errorMsg.includes('ANTHROPIC_API_KEY') || errorMsg.includes('API key')) {
            errorContent = '⚠️ API key not configured. Please add your ANTHROPIC_API_KEY to the .env file and restart the server.';
          } else if (errorMsg.includes('rate limit')) {
            errorContent = '⏱️ Rate limit exceeded. Please wait a moment and try again.';
          } else if (errorMsg.includes('model:')) {
            errorContent = '🔧 Model configuration error. Please check your API key and model settings.';
          } else if (response.status === 401) {
            errorContent = '🔑 Invalid API key. Please check your ANTHROPIC_API_KEY in the .env file.';
          } else if (response.status === 500) {
            errorContent = `❌ Server error: ${errorMsg}. Please check the console for details.`;
          }
        } catch {
          // If we can't parse the error, use status-based messages
          if (response.status === 401) {
            errorContent = '🔑 Authentication failed. Please check your API key configuration.';
          } else if (response.status === 500) {
            errorContent = '❌ Server error. Please check the console for details.';
          }
        }

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorContent,
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I received your message!',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      // Network or parsing error
      let errorContent = '🌐 Network error. Please check your connection and try again.';

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorContent = '🌐 Cannot connect to server. Please ensure the development server is running.';
      } else if (error instanceof SyntaxError) {
        errorContent = '⚠️ Received invalid response from server. Please check the console for details.';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
                <button
                  onClick={() => setInput("Help me define my project goals")}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left transition-colors"
                >
                  <p className="text-sm font-medium">💡 "Help me define my project goals"</p>
                </button>
                <button
                  onClick={() => setInput("What are my strategic options?")}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left transition-colors"
                >
                  <p className="text-sm font-medium">🎯 "What are my strategic options?"</p>
                </button>
                <button
                  onClick={() => setInput("Show me my decision map")}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left transition-colors"
                >
                  <p className="text-sm font-medium">📊 "Show me my decision map"</p>
                </button>
                <button
                  onClick={() => setInput("How do I get started?")}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-left transition-colors"
                >
                  <p className="text-sm font-medium">🚀 "How do I get started?"</p>
                </button>
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
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
