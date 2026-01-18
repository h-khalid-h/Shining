import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { atom } from 'nanostores';
import type { Message } from '~/types/message';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { getMessages, getNextId, getUrlId, openDatabase, setMessages } from './db';

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
}

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

// Lazy database initialization to avoid top-level await
let dbInstance: IDBDatabase | undefined;
let dbPromise: Promise<IDBDatabase | undefined> | undefined;

export async function getDb(): Promise<IDBDatabase | undefined> {
  if (!persistenceEnabled) return undefined;
  if (dbInstance) return dbInstance;
  if (!dbPromise) {
    dbPromise = openDatabase().then(db => {
      dbInstance = db;
      return db;
    });
  }
  return dbPromise;
}

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);

export function useChatHistory() {
  const navigate = useNavigate();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isRootRoute = pathname === '/';
  const mixedId = !isRootRoute ? pathname.split('/').pop() : undefined;

  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setReady(true);
      return;
    }

    // If on root route, don't try to load or create chats - just mark as ready
    if (isRootRoute) {
      setReady(true);
      return;
    }

    const loadHistory = async () => {
      const db = await getDb();

      if (!db) {
        setReady(true);
        if (persistenceEnabled) {
          toast.error(`Chat persistence is unavailable`);
        }
        return;
      }

      if (mixedId) {
        try {
          const storedMessages = await getMessages(db, mixedId);

          if (storedMessages && storedMessages.messages.length > 0) {
            setInitialMessages(storedMessages.messages);
            setUrlId(storedMessages.urlId);
            description.set(storedMessages.description);
            chatId.set(storedMessages.id);
          } else {
            // Chat not found, redirect to root
            navigate(`/`, { replace: true });
          }

          setReady(true);
        } catch (error: any) {
          toast.error(error.message);
          setReady(true);
        }
      } else {
        // No chat ID provided on non-root route - shouldn't happen
        setReady(true);
      }
    };

    loadHistory();
  }, []);

  return {
    ready: !mixedId || ready,
    initialMessages,
    storeMessageHistory: async (messages: Message[]) => {
      const db = await getDb();
      if (!db || !urlId) {
        return;
      }

      const currentChatId = chatId.get();

      if (!currentChatId) {
        console.error('Chat ID not set');
        return;
      }

      try {
        await setMessages(db, currentChatId, messages, urlId, description.get());
      } catch (error) {
        console.error('Failed to store messages', error);
      }
    },
  };
}
