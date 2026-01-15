'use client';

import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';

interface HeaderActionButtonsProps { }

export function HeaderActionButtons({ }: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);

  const canHideChat = showWorkbench || !showChat;

  return (
    <div className="flex gap-1">
      <button
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${showChat
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
          } ${!canHideChat ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={!canHideChat}
        aria-label="Toggle chat panel"
        title="Toggle chat panel"
        onClick={() => {
          if (canHideChat) {
            chatStore.setKey('showChat', !showChat);
          }
        }}
      >
        💬 Chat
      </button>
      <button
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${showWorkbench
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
          } cursor-pointer`}
        aria-label="Toggle workbench panel"
        title="Toggle workbench panel"
        onClick={() => {
          if (showWorkbench && !showChat) {
            chatStore.setKey('showChat', true);
          }

          workbenchStore.showWorkbench.set(!showWorkbench);
        }}
      >
        💻 Code
      </button>
    </div>
  );
}
