import type { Route } from './+types/_index';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/react-router';
import { HeaderClient } from '~/components/header/Header.client';
import { Chat } from '~/components/chat/Chat.client';
import { IntelligenceLayerClient } from '~/components/intelligence/IntelligenceLayer.client';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Shining' }, { name: 'description', content: 'Intelligent outcome platform powered by AI' }];
};

export default function Index() {
  const { userId } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      {isClient ? <HeaderClient /> : (
        <header className="flex items-center justify-between bg-white p-5 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-semibold text-blue-600">Shining</a>
          </div>
          <span className="text-sm text-gray-600">Intelligent Outcome Platform</span>
        </header>
      )}
      <div className="flex-1 relative">
        {isClient ? <Chat onMessageCountChange={setMessageCount} /> : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}
        {isClient && <IntelligenceLayerClient userId={userId ?? null} messageCount={messageCount} />}
      </div>
    </div>
  );
}
