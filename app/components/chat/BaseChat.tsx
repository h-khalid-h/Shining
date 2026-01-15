import type { Message } from 'ai';
import React, { type RefCallback } from 'react';
import { Menu } from '~/components/sidebar/Menu.client';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/Button';

import styles from './BaseChat.module.scss';

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
}

const EXAMPLE_PROMPTS = [
  { text: 'Build a todo app in React using Tailwind', icon: 'i-ph:code-duotone' },
  { text: 'Build a simple blog using Astro', icon: 'i-ph:pen-duotone' },
  { text: 'Create a cookie consent form using Material UI', icon: 'i-ph:cookie-duotone' },
  { text: 'Make a space invaders game', icon: 'i-ph:game-controller-duotone' },
  { text: 'How do I center a div?', icon: 'i-ph:question-duotone' },
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
    },
    ref,
  ) => {
    const chatStarted = useStore(chatStore).started;
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-bolt-elements-background-depth-1',
        )}
        data-chat-visible={showChat}
      >
        <Menu />
        <div ref={scrollRef} className="flex overflow-y-auto w-full h-full">
          <div
            className={classNames(
              styles.Chat,
              'flex flex-col flex-grow w-full md:min-w-[var(--chat-min-width)] h-full',
            )}
          >
            {!chatStarted && (
              <motion.div
                id="intro"
                className="mt-[26vh] max-w-chat mx-auto"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <h1 className="text-5xl text-center font-bold text-bolt-elements-textPrimary mb-2">
                  Where ideas begin
                </h1>
                <p className="mb-4 text-center text-bolt-elements-textSecondary">
                  Bring ideas to life in seconds or get help on existing projects.
                </p>
              </motion.div>
            )}
            <div
              className={classNames('pt-6 px-6', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              {chatStarted ? (
                <Messages
                  ref={messageRef}
                  className="flex flex-col w-full flex-1 max-w-chat px-4 pb-6 mx-auto z-1"
                  messages={messages}
                  isStreaming={isStreaming}
                />
              ) : null}
              <div
                className={classNames('relative w-full max-w-chat mx-auto z-prompt', {
                  'sticky bottom-0': chatStarted,
                })}
              >
                <div
                  className={classNames(
                    'shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden',
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    className={`w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent`}
                    onKeyDown={(event) => {
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
                      minHeight: TEXTAREA_MIN_HEIGHT,
                      maxHeight: TEXTAREA_MAX_HEIGHT,
                    }}
                    placeholder="How can Bolt help you today?"
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
                      <div className="text-xs text-bolt-elements-textTertiary">
                        Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for a new line
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="bg-bolt-elements-background-depth-1 pb-6">{/* Ghost Element */}</div>
              </div>
            </div>
            {!chatStarted && (
              <motion.div
                id="examples"
                className="relative w-full max-w-chat mx-auto mt-8 flex justify-center"
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
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
          <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />
        </div>
      </div>
    );
  },
);
