import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { ChatDescription } from './ChatDescription';
import { HeaderActionButtons } from './HeaderActionButtons.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center justify-between bg-bolt-elements-background-depth-1 p-5 border-b h-[var(--header-height)]',
        {
          'border-transparent': !chat.started,
          'border-bolt-elements-borderColor': chat.started,
        },
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
          <div className="i-ph:sidebar-simple-duotone text-xl" />
          <a href="/" className="text-2xl font-semibold text-accent flex items-center">
            <span className="i-bolt:logo-text?mask w-[46px] inline-block" />
          </a>
        </div>
        <ChatDescription />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-bolt-elements-textSecondary">
          Intelligent Outcome Platform
        </span>
        <HeaderActionButtons />
      </div>
    </header>
  );
}
