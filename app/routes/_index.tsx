import type { Route } from './+types/_index';
import { useState, useEffect } from 'react';
import { Header } from '~/components/header/Header';
import { Chat } from '~/components/chat/Chat.client';
import { IntelligenceLayerClient } from '~/components/intelligence/IntelligenceLayer.client';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Shining' }, { name: 'description', content: 'Intelligent outcome platform powered by AI' }];
};

export default function Index() {
  const [isClient, setIsClient] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <div className="flex-1 relative">
        {isClient ? <Chat /> : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}
        {isClient && <IntelligenceLayerClient userId={null} messageCount={messageCount} />}
      </div>
    </div>
  );
}
