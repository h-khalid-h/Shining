import type { Message } from 'ai';
import React, { type RefCallback, lazy, Suspense, useEffect } from 'react';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';
import { ClientOnly } from '~/components/ui/ClientOnly';
import { ResizablePanels } from '~/components/ui/ResizablePanels';

import styles from './BaseChat.module.scss';
import type { DecisionPoint } from '~/components/intelligence/DecisionCards';

// Lazy load components that use browser-only features
const Menu = lazy(() => import('~/components/sidebar/Menu.client').then(m => ({ default: m.Menu })));
const Workbench = lazy(() => import('~/components/workbench/Workbench.client').then(m => ({ default: m.Workbench })));

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
  intentSuggestionsSlot?: React.ReactNode;
  onSelectDecision?: (optionId: string, decision: DecisionPoint) => void;
}

// Outcome-focused example prompts for Gence - The Intelligence Layer
const EXAMPLE_PROMPTS = [
  { text: 'Help me understand what architecture best achieves scalability for my use case', icon: 'i-ph:graph-duotone' },
  { text: 'Build a dashboard that gives me insights into user behavior patterns', icon: 'i-ph:chart-line-up-duotone' },
  { text: 'Create a system that captures and qualifies leads automatically', icon: 'i-ph:funnel-duotone' },
  { text: 'Design a pricing calculator that optimizes for conversion', icon: 'i-ph:calculator-duotone' },
];

const TEXTAREA_MIN_HEIGHT = 76;

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
      intentSuggestionsSlot,
      onSelectDecision,
    },
    ref,
  ) => {
    const chatStarted = useStore(chatStore).started;
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

    // Auto-expand textarea based on content
    useEffect(() => {
      if (textareaRef?.current) {
        const textarea = textareaRef.current;
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set height to scrollHeight, capped at max height
        const newHeight = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT);
        textarea.style.height = `${Math.max(newHeight, TEXTAREA_MIN_HEIGHT)}px`;
      }
    }, [input, TEXTAREA_MAX_HEIGHT]); // Removed textareaRef from dependencies

    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-bolt-elements-background-depth-1 pt-12',
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>
          <Suspense fallback={null}>
            <Menu />
          </Suspense>
        </ClientOnly>

        <ResizablePanels
          leftPanel={
            <div className="flex flex-col w-full h-full">
              {/* Scrollable messages area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto w-full">
                <div
                  className={classNames(
                    styles.Chat,
                    'flex flex-col flex-grow w-full md:min-w-[var(--chat-min-width)]',
                  )}
                >
                  {!chatStarted && (
                    <motion.div
                      id="intro"
                      className="mt-[26vh] max-w-chat mx-auto px-6"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      <h1 className="text-5xl text-center font-bold text-bolt-elements-textPrimary mb-2">
                        Gence
                      </h1>
                      <p className="mb-4 text-center text-bolt-elements-textSecondary">
                        The Intelligence Layer
                      </p>
                      <p className="text-sm text-center text-bolt-elements-textTertiary max-w-md mx-auto">
                        I understand context, track intent, and help you build with purpose.
                      </p>
                    </motion.div>
                  )}
                  <div className={classNames('pt-6 px-6 pb-4')}>
                    {chatStarted ? (
                      <Messages
                        ref={messageRef}
                        className="flex flex-col w-full max-w-chat px-4 mx-auto z-1"
                        messages={messages}
                        isStreaming={isStreaming}
                        onSelectDecision={onSelectDecision}
                      />
                    ) : null}
                  </div>
                  {/* Example prompts - only shown when not chatting */}
                  {!chatStarted && (
                    <motion.div
                      id="examples"
                      className="relative w-full max-w-chat mx-auto mt-8 flex justify-center pb-6 px-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <div className="flex flex-col space-y-2 [mask-image:linear-gradient(to_bottom,black_0%,transparent_180%)] hover:[mask-image:none]">
                        {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
                          <motion.button
                            key={index}
                            onClick={(event) => {
                              sendMessage?.(event, examplePrompt.text);
                            }}
                            className="group flex items-center w-full gap-2 justify-center bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-theme"
                            initial={{ opacity: 1, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                          >
                            <div className="text-lg">
                              <div className={examplePrompt.icon} />
                            </div>
                            {examplePrompt.text}
                            <div className="i-ph:arrow-right text-lg" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Sticky input area - OUTSIDE scroll container */}
              <div className="flex-shrink-0 w-full bg-bolt-elements-background-depth-1 border-t border-bolt-elements-borderColor">
                <div className="relative w-full max-w-chat mx-auto px-6 py-4">
                  {/* Intent Suggestions - positioned above textarea */}
                  {intentSuggestionsSlot}

                  <div
                    className={classNames(
                      'shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden',
                    )}
                  >
                    <textarea
                      ref={textareaRef}
                      className={`w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent`}
                      onKeyDown={(event) => {
                        // Cmd/Ctrl + Enter to send
                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault();
                          sendMessage?.(event);
                          return;
                        }

                        // Cmd/Ctrl + K for prompt enhancement
                        if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault();
                          if (input.trim().length > 0 && !enhancingPrompt) {
                            enhancePrompt?.();
                          }
                          return;
                        }

                        // Escape to clear input
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          handleInputChange?.({ target: { value: '' } } as any);
                          return;
                        }

                        // Regular Enter without modifiers
                        if (event.key === 'Enter') {
                          if (event.shiftKey) {
                            return;
                          }

                          event.preventDefault();
                          sendMessage?.(event);
                        }
                      }}
                      value={input}
                      onChange={(event) => {
                        handleInputChange?.(event);
                      }}
                      style={{
                        maxHeight: TEXTAREA_MAX_HEIGHT,
                      }}
                      placeholder="Tell me what you want to achieve"
                      translate="no"
                    />
                    <SendButton
                      show={input.length > 0 || isStreaming}
                      isStreaming={isStreaming}
                      onClick={(event) => {
                        if (isStreaming) {
                          handleStop?.();
                          return;
                        }

                        sendMessage?.(event);
                      }}
                    />
                    <div className="flex justify-between text-sm p-4 pt-2">
                      <div className="flex gap-1 items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Enhance prompt"
                          disabled={input.length === 0 || enhancingPrompt}
                          className={classNames({
                            'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!':
                              promptEnhanced,
                            'pr-1.5': !promptEnhanced,
                          })}
                          onClick={() => {
                            enhancePrompt?.();
                          }}
                        >
                          {enhancingPrompt ? (
                            <>
                              <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl"></div>
                            </>
                          ) : (
                            <>
                              <div className="i-bolt:stars text-xl"></div>
                              {promptEnhanced && <div className="ml-1.5">Prompt enhanced</div>}
                            </>
                          )}
                        </Button>
                      </div>
                      {input.length > 3 ? (
                        <div className="hidden md:flex text-xs text-bolt-elements-textTertiary items-center gap-4">
                          <span>
                            <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for new line
                          </span>
                          <span>
                            <kbd className="kdb">⌘</kbd> + <kbd className="kdb">K</kbd> to enhance
                          </span>
                        </div>
                      ) : (
                        <div className="hidden md:block text-xs text-bolt-elements-textTertiary">
                          <kbd className="kdb">⌘</kbd> + <kbd className="kdb">Enter</kbd> to send
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
          rightPanel={
            <ClientOnly>
              <Suspense fallback={null}>
                <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />
              </Suspense>
            </ClientOnly>
          }
        />
      </div>
    );
  },
);
