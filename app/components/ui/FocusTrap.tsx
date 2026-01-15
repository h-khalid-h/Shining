import { useEffect, useRef, type ReactNode } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
}

/**
 * FocusTrap component for accessibility.
 * Traps keyboard focus within a container (e.g., modals, dialogs).
 * Handles Escape key and restores focus on unmount.
 */
export function FocusTrap({ children, active = true, onEscape, restoreFocus = true }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    // store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    // get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

      return Array.from(container.querySelectorAll(selector));
    };

    // focus first element
    const focusableElements = getFocusableElements();

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();

        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // restore focus to previous element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, onEscape, restoreFocus]);

  return <div ref={containerRef}>{children}</div>;
}
