import type { Route } from './+types/_index';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react-router';
import { Chat } from '~/components/chat/Chat.client';
import { IntelligenceLayerClient } from '~/components/intelligence/IntelligenceLayer.client';
import { useChatHistory } from '~/lib/persistence/useChatHistory';
import { ErrorBoundary } from '~/components/ui/ErrorBoundary';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Meldon - The Intelligence Layer' }, { name: 'description', content: 'Intelligent development partner that understands context, tracks intent, and builds with purpose' }];
};

export default function Index() {
  const { userId } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const { ready, initialMessages, storeMessageHistory } = useChatHistory();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !ready) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-bolt-elements-background-depth-1">
        <div className="text-bolt-elements-textSecondary">Understanding context...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-bolt-elements-background-depth-1">
      <ErrorBoundary>
        <Chat
          initialMessages={initialMessages}
          storeMessageHistory={storeMessageHistory}
          onMessageCountChange={setMessageCount}
        />
      </ErrorBoundary>
      <ErrorBoundary>
        <IntelligenceLayerClient userId={userId ?? null} messageCount={messageCount} />
      </ErrorBoundary>
    </div>
  );
}
