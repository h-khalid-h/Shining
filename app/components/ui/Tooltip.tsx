import * as RadixTooltip from '@radix-ui/react-tooltip';
import { type ReactNode } from 'react';
import { classNames } from '~/utils/classNames';

interface TooltipProps {
  content: string;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
  delayDuration?: number;
}

/**
 * Tooltip component for displaying helpful hints on hover.
 * Supports keyboard shortcuts display and is fully accessible.
 */
export function Tooltip({ content, shortcut, side = 'top', children, delayDuration = 500 }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={5}
            className={classNames(
              'z-tooltip px-3 py-2 rounded-md text-sm',
              'bg-bolt-elements-tooltip-background text-bolt-elements-tooltip-text',
              'shadow-lg border border-bolt-elements-borderColor',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            )}
          >
            <div className="flex items-center gap-2">
              <span>{content}</span>
              {shortcut && (
                <kbd className="px-1.5 py-0.5 text-xs rounded bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor font-mono">
                  {shortcut}
                </kbd>
              )}
            </div>
            <RadixTooltip.Arrow className="fill-bolt-elements-tooltip-background" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
