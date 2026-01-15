import type { Route } from './+types/_index';
import { useState, useEffect } from 'react';
import { Header } from '~/components/header/Header';
import { Chat } from '~/components/chat/Chat.client';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Shining' }, { name: 'description', content: 'Intelligent outcome platform powered by AI' }];
};

export default function Index() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      {isClient ? <Chat /> : (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}
    </div>
  );
}
