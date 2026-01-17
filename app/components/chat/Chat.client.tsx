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
import { useRef, useEffect, useCallback, useState } from 'react';
import type { Message } from 'ai';
import { useStore } from '@nanostores/react';
import { BaseChat } from './BaseChat';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { useMessageParser } from '~/lib/hooks/useMessageParser';
import { usePromptEnhancer } from '~/lib/hooks/usePromptEnhancer';
import { useSnapScroll } from '~/lib/hooks/useSnapScroll';
import { useConnectionStatus } from '~/lib/hooks/useConnectionStatus';
import { description as descriptionStore } from '~/lib/persistence/useChatHistory';
import { fetchWithRetry } from '~/lib/utils/fetch-utils';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Chat');

export interface ChatProps {
    initialMessages?: Message[];
    storeMessageHistory?: (messages: Message[]) => void;
    onMessageCountChange?: (count: number) => void;
}

export function Chat({ initialMessages = [], storeMessageHistory, onMessageCountChange }: ChatProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { enhancingPrompt, promptEnhanced, enhancePrompt, resetEnhancer } = usePromptEnhancer();
    const { parsedMessages, parseMessages } = useMessageParser();
    const isOnline = useConnectionStatus();
    // useSnapScroll returns [messageRef, scrollRef] - auto-scrolls via ResizeObserver
    const [messageRef, scrollRef] = useSnapScroll();

    // Update message count when messages change
    useEffect(() => {
        onMessageCountChange?.(messages.length);
    }, [messages.length, onMessageCountChange]);

    // Parse messages when they change
    useEffect(() => {
        parseMessages(messages, isLoading);

        if (messages.length > 0 && !isLoading) {
            chatStore.setKey('started', true);
        }
    }, [messages, isLoading]);

    // Store messages when they change
    useEffect(() => {
        if (messages.length > 0) {
            storeMessageHistory?.(messages);

            // Extract description from first message
            if (messages.length === 1 && messages[0].role === 'user') {
                const content = messages[0].content;
                const firstSentence = content.split(/[.!?]/)[0].slice(0, 100);
                descriptionStore.set(firstSentence);
            }
        }
    }, [messages]);

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
    }, []);

    const handleStop = useCallback(() => {
        chatStore.setKey('aborted', true);
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsLoading(false);
    }, []);

    const sendMessage = useCallback(async (event: React.UIEvent, messageInput?: string) => {
        event.preventDefault();

        const messageText = messageInput || input;
        if (!messageText.trim() || isLoading) return;

        // Check connection status
        if (!isOnline) {
            const offlineMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '🔌 You\'re currently offline. Please check your internet connection and try again.',
            };
            setMessages(prev => [...prev, offlineMessage]);
            return;
        }

        // Reset states
        resetEnhancer();
        setInput('');
        chatStore.setKey('started', true);
        chatStore.setKey('aborted', false);
        workbenchStore.resetAllFileModifications();

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetchWithRetry(
                '/api/chat',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: updatedMessages }),
                    signal: abortControllerRef.current.signal,
                },
                2, // 2 retries
                30000 // 30 second timeout
            );

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Read streaming response
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let assistantContent = '';
            const assistantId = (Date.now() + 1).toString();

            // Add empty assistant message immediately
            const assistantMessage: Message = {
                id: assistantId,
                role: 'assistant',
                content: '',
            };
            setMessages([...updatedMessages, assistantMessage]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                // Parse AI SDK stream format
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('0:')) {
                        const match = line.match(/^0:"(.*)"/);
                        if (match) {
                            const text = match[1]
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/\\\\/g, '\\');
                            assistantContent += text;
                        }
                    }
                }

                // Update the assistant message with streaming content
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                        updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
                    }
                    return updated;
                });
            }

        } catch (error) {
            logger.error('Chat error:', error);

            // Determine error type and provide contextual message
            let errorContent = '';

            if (error instanceof TypeError && error.message.includes('fetch')) {
                // Network error
                errorContent = '🔌 Network connection lost. Your conversation is saved locally and will sync when reconnected. Please check your internet connection and try again.';
            } else if (error instanceof Error && error.message.includes('Failed to send message')) {
                // API error
                errorContent = '🤖 I encountered an issue connecting to my intelligence backend. This might be temporary - please try again in a moment.';
            } else {
                // Generic error with helpful suggestion
                errorContent = '⚠️ I had trouble processing that request. Let\'s try rephrasing your message or breaking it into smaller parts.';
            }

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: errorContent,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, messages, isLoading]);

    const handleEnhancePrompt = useCallback(() => {
        enhancePrompt(input, setInput);
    }, [input, enhancePrompt]);

    return (
        <BaseChat
            ref={scrollRef}
            textareaRef={textareaRef}
            messageRef={messageRef}
            scrollRef={scrollRef}
            showChat={true}
            isStreaming={isLoading}
            messages={messages.map((msg, idx) => ({
                ...msg,
                content: parsedMessages[idx] !== undefined ? parsedMessages[idx] : msg.content,
            }))}
            enhancingPrompt={enhancingPrompt}
            promptEnhanced={promptEnhanced}
            input={input}
            sendMessage={sendMessage}
            handleInputChange={handleInputChange}
            enhancePrompt={handleEnhancePrompt}
            handleStop={handleStop}
        />
    );
}
