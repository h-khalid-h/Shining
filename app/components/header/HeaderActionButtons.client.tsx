'use client';

import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { Button } from '~/components/ui/Button';
import { Tooltip } from '~/components/ui/Tooltip';

interface HeaderActionButtonsProps { }

export function HeaderActionButtons({ }: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);

  const canHideChat = showWorkbench || !showChat;

  return (
    <div className="flex gap-1">
      <Tooltip content="Toggle chat panel" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          active={showChat}
          disabled={!canHideChat}
          icon="i-ph:chat-circle-dots"
          aria-label="Toggle chat panel"
          onClick={() => {
            if (canHideChat) {
              chatStore.setKey('showChat', !showChat);
            }
          }}
        >
          Chat
        </Button>
      </Tooltip>
      <Tooltip content="Toggle workbench panel" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          active={showWorkbench}
          icon="i-ph:code-bold"
          aria-label="Toggle workbench panel"
          onClick={() => {
            if (showWorkbench && !showChat) {
              chatStore.setKey('showChat', true);
            }

            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          Code
        </Button>
      </Tooltip>
    </div>
  );
}
