import type { Route } from './+types/_index';
import { Header } from '~/components/header/Header';
import { Chat } from '~/components/chat/Chat.client';

export const meta: Route.MetaFunction = () => {
  return [{ title: 'Shining' }, { name: 'description', content: 'Intelligent outcome platform powered by AI' }];
};

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <Chat />
    </div>
  );
}
