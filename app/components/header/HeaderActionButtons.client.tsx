import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { Button } from '~/components/ui/Button';
import { Tooltip } from '~/components/ui/Tooltip';

interface HeaderActionButtonsProps {}

export function HeaderActionButtons({}: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);

  const canHideChat = showWorkbench || !showChat;

  return (
    <div className="flex">
      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden">
        <Tooltip content="Toggle chat panel" side="bottom">
          <Button
            variant="ghost"
            size="sm"
            active={showChat}
            disabled={!canHideChat}
            icon="i-bolt:chat"
            aria-label="Toggle chat panel"
            onClick={() => {
              if (canHideChat) {
                chatStore.setKey('showChat', !showChat);
              }
            }}
          />
        </Tooltip>
        <div className="w-[1px] bg-bolt-elements-borderColor" />
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
          />
        </Tooltip>
      </div>
    </div>
  );
}
