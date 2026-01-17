import { useEffect, useRef } from 'react';

/**
 * Hook that provides refs for auto-scrolling to the latest message.
 * Uses a "sticky" scroll pattern: if user is at bottom, it stays at bottom when content updates.
 */
export function useSnapScroll<T = any>(dependencies?: T[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null); // Kept for API compatibility but not used for observer

  // Track if we are at the bottom. Start true to allow initial scroll.
  const isAtBottomRef = useRef(true);

  // 1. Setup Scroll Listener to track user position
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      // Use a generous threshold (e.g. 50px) to consider "at bottom"
      const distance = scrollHeight - scrollTop - clientHeight;
      isAtBottomRef.current = distance < 50;
    };

    // Initial check
    handleScroll();

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. React to Content Updates (Dependencies)
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // If we were at the bottom (before this update), assume we want to stay there
    if (isAtBottomRef.current) {
      // requestAnimationFrame ensures we scroll after layout updates
      requestAnimationFrame(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, dependencies || []);

  return [messageRef, scrollRef] as const;
}
