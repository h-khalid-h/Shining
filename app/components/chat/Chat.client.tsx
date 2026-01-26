/**
 * Chat - Full Chat Integration
 * 
 * This component connects all chat features:
 * - BaseChat UI with Workbench and Menu
 * - Streaming AI responses
 * - Artifact parsing and execution
 * - Prompt enhancement
 * - Chat history persistence
 */
import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type { Message } from '~/types/message';
import { useStore } from '@nanostores/react';
import { useAuth, useClerk } from '@clerk/react-router';
import { BaseChat } from './BaseChat';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { useMessageParser } from '~/lib/hooks/useMessageParser';
import { usePromptEnhancer } from '~/lib/hooks/usePromptEnhancer';
import { useSnapScroll } from '~/lib/hooks/useSnapScroll';
import { useConnectionStatus } from '~/lib/hooks/useConnectionStatus';
import { useIntentPrediction } from '~/lib/hooks/useIntentPrediction';
import { useDebounce } from '~/lib/hooks/useDebounce';
import { useAutoKineticTracking } from '~/lib/hooks/useAutoKineticTracking';
import { description as descriptionStore } from '~/lib/persistence/useChatHistory';
import { fetchWithRetry } from '~/lib/utils/fetch-utils';
import { IntentSuggestions } from '~/components/intelligence/IntentSuggestions';
import { DecisionCards, type DecisionPoint } from '~/components/intelligence/DecisionCards';
import { detectDecisionPoint, matchDecisionResponse } from '~/lib/intelligence/decision-detector';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Chat');

export interface ChatProps {
    initialMessages?: Message[];
    storeMessageHistory?: (messages: Message[]) => void;
    onMessageCountChange?: (count: number) => void;
    startWithPrompt?: string;
}

export interface ChatRef {
    sendMessage: (message: string) => void;
}

export const Chat = forwardRef<ChatRef, ChatProps>(({ initialMessages = [], storeMessageHistory, onMessageCountChange, startWithPrompt }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // ... existing refs
    
    // ... existing state and hooks

    const sendMessage = useCallback(async (event: React.UIEvent, messageInput?: string) => {
        // ... existing sendMessage implementation
    }, [input, messages, isLoading, userId, clerk, isOnline, resetEnhancer]);

    // Expose sendMessage to parent
    useImperativeHandle(ref, () => ({
        sendMessage: (message: string) => {
            sendMessage({ preventDefault: () => { } } as React.UIEvent, message);
        }
    }));

    // ... rest of the component implementation
    
    return (
        <BaseChat
            // ... existing props
            ref={ref} // Pass ref if BaseChat accepts it, otherwise remove this line if BaseChat doesn't use ref
        />
    );
});

Chat.displayName = 'Chat';
