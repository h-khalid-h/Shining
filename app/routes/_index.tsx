import type { Route } from './+types/_index';
import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { HeaderClient } from '~/components/header/Header.client';
import { Chat } from '~/components/chat/Chat.client';
import { IntelligenceLayerClient } from '~/components/intelligence/IntelligenceLayer.client';
import { Workbench } from '~/components/workbench/Workbench.client';
import { workbenchStore } from '~/lib/stores/workbench';
import { chatStore } from '~/lib/stores/chat';

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
      {isClient ? <HeaderClient /> : (
        <header className="flex items-center justify-between bg-white p-5 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl font-semibold text-blue-600">Shining</a>
          </div>
          <span className="text-sm text-gray-600">Intelligent Outcome Platform</span>
        </header>
      )}
      <div className="flex-1 flex overflow-hidden">
        {isClient ? (
          <WorkbenchLayout messageCount={messageCount} setMessageCount={setMessageCount} />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component to use stores
function WorkbenchLayout({ messageCount, setMessageCount }: { messageCount: number; setMessageCount: (count: number) => void }) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);

  return (
    <>
      {showChat && (
        <div className="flex-1 relative">
          <Chat onMessageCountChange={setMessageCount} />
          <IntelligenceLayerClient userId={null} messageCount={messageCount} />
        </div>
      )}
      {showWorkbench && (
        <div className="flex-1">
          <Workbench chatStarted={messageCount > 0} isStreaming={false} />
        </div>
      )}
      {!showChat && !showWorkbench && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Shining</h2>
            <p className="text-gray-600 mb-6">Open Chat or Code to get started</p>
          </div>
        </div>
      )}
    </>
  );
}
