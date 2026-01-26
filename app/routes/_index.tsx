import type { Route } from './+types/_index';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/react-router';
import { Chat } from '~/components/chat/Chat.client';
import { IntelligenceLayerClient } from '~/components/intelligence/IntelligenceLayer.client';
import { Menu } from '~/components/sidebar/Menu.client';
import { Header } from '~/components/header/Header';
import { useChatHistory } from '~/lib/persistence/useChatHistory';
import { ErrorBoundary } from '~/components/ui/ErrorBoundary';
import { IntelligenceTour } from '~/components/onboarding/IntelligenceTour';

export const meta: Route.MetaFunction = () => {
  return [
    { title: 'Gence - AI-Powered Development with Strategic Intelligence' },
    {
      name: 'description',
      content:
        'The only IDE that keeps you aligned with your goals. Build with AI-powered intent extraction, drift detection, and strategic guidance.',
    },
  ];
};

export default function Index() {
  const { userId } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const { ready, initialMessages, storeMessageHistory } = useChatHistory();
  
  // Create ref to access Chat methods
  const chatRef = useRef<{ sendMessage: (msg: string) => void }>(null);

  useEffect(() => {
    setIsClient(true);

    // Handle initial North from onboarding
    const params = new URLSearchParams(window.location.search);
    const initialNorth = params.get('initialNorth');

    if (initialNorth && ready && initialMessages.length === 0) {
      // Create initial context message
      const contextMessage = {
        role: 'user' as const,
        content: `I am starting a new project. My primary goal (North) is: "${initialNorth}". Please help me act on this immediately.`,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };

      storeMessageHistory([contextMessage]);
      // Remove param from URL to prevent re-triggering
      window.history.replaceState({}, '', '/');
    }
  }, [ready, initialMessages.length, storeMessageHistory]);

  const handleSendMessage = (message: string) => {
    if (chatRef.current) {
      chatRef.current.sendMessage(message);
    } else {
      console.warn('Chat ref not available');
    }
  };

  if (!isClient || !ready) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-bolt-elements-background-depth-1">
        <div className="text-bolt-elements-textSecondary">Understanding context...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-bolt-elements-background-depth-1">
      {/* Onboarding Tour */}
      <IntelligenceTour />

      {/* Header - Always visible */}
      <ErrorBoundary>
        <Header 
          onOpenDashboard={() => setShowDashboard(true)}
          showDashboardButton={!!userId}
        />
      </ErrorBoundary>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Opens on hover */}
        <ErrorBoundary>
          <Menu />
        </ErrorBoundary>

        {/* Chat and Intelligence Layer */}
        <div className="flex flex-1 overflow-hidden">
          <ErrorBoundary>
            <Chat
              ref={chatRef}
              initialMessages={initialMessages}
              storeMessageHistory={storeMessageHistory}
              onMessageCountChange={setMessageCount}
            />
          </ErrorBoundary>
          <ErrorBoundary>
            <IntelligenceLayerClient 
              userId={userId ?? null} 
              messageCount={messageCount}
              externalShowDashboard={showDashboard}
              onDashboardClose={() => setShowDashboard(false)}
              onSendMessage={handleSendMessage}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

