import type { Route } from './+types/_index';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';

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
