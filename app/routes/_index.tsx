import { json } from 'react-router';
import type { Route } from './+types/_index';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Shining' }, { name: 'description', content: 'Intelligent outcome platform powered by AI' }];
};

export const loader = () => json({});

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
