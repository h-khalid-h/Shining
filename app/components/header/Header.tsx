import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { Tooltip } from '~/components/ui/Tooltip';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center bg-bolt-elements-background-depth-1 p-5 border-b h-[var(--header-height)]',
        {
          'border-transparent': !chat.started,
          'border-bolt-elements-borderColor': chat.started,
        },
      )}
    >
      <Tooltip content="Open sidebar" side="right">
        <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary cursor-pointer">
          <div className="i-ph:sidebar-simple-duotone text-xl" />
          <a href="/" className="text-2xl font-semibold text-accent flex items-center">
            <span className="i-bolt:logo-text?mask w-[46px] inline-block" />
          </a>
        </div>
      </Tooltip>
      <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
        Shining - Intelligent Outcome Platform
      </span>
    </header>
  );
}
