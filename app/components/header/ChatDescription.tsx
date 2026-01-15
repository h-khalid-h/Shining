import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';

export function ChatDescription() {
    const chat = useStore(chatStore);

    if (!chat.started) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
            <span className="i-ph:chat-circle-dots text-lg" />
            <span>Active conversation</span>
        </div>
    );
}
