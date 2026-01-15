import { useStore } from '@nanostores/react';
import { description } from './useChatHistory';

export function ChatDescription() {
  const desc = useStore(description);
  return desc || null;
}
