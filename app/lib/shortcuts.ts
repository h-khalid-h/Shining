/**
 * Centralized keyboard shortcut registry for the application.
 * Provides consistent shortcut definitions and platform-specific formatting.
 */

export interface Shortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  label: string;
  description: string;
}

/**
 * Application keyboard shortcuts.
 */
export const shortcuts = {
  // preview
  RELOAD_PREVIEW: {
    key: 'r',
    meta: true,
    label: '⌘R',
    description: 'Reload preview',
  },

  // editor
  SAVE_FILE: {
    key: 's',
    meta: true,
    label: '⌘S',
    description: 'Save current file',
  },

  // terminal
  TOGGLE_TERMINAL: {
    key: '`',
    meta: true,
    label: '⌘`',
    description: 'Toggle terminal',
  },

  // navigation
  COMMAND_PALETTE: {
    key: 'k',
    meta: true,
    label: '⌘K',
    description: 'Open command palette',
  },
  FILE_SWITCHER: {
    key: 'p',
    meta: true,
    label: '⌘P',
    description: 'Quick file switcher',
  },

  // panels
  TOGGLE_CHAT: {
    key: '1',
    meta: true,
    label: '⌘1',
    description: 'Toggle chat panel',
  },
  TOGGLE_WORKBENCH: {
    key: '2',
    meta: true,
    label: '⌘2',
    description: 'Toggle workbench panel',
  },
} as const satisfies Record<string, Shortcut>;

/**
 * Format shortcut for display based on platform.
 */
export function formatShortcut(shortcut: Shortcut): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  if (isMac) {
    return shortcut.label;
  }

  // convert Mac shortcuts to Windows/Linux
  return shortcut.label.replace('⌘', 'Ctrl+').replace('⌥', 'Alt+').replace('⇧', 'Shift+');
}

/**
 * Get shortcut by key combination.
 */
export function getShortcutByKey(key: string, meta?: boolean, ctrl?: boolean, shift?: boolean): Shortcut | undefined {
  return Object.values(shortcuts).find(
    (shortcut) =>
      shortcut.key === key &&
      shortcut.meta === meta &&
      (shortcut.ctrl ?? false) === (ctrl ?? false) &&
      (shortcut.shift ?? false) === (shift ?? false),
  );
}

/**
 * Check if event matches shortcut.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    event.metaKey === !!shortcut.meta &&
    event.ctrlKey === !!shortcut.ctrl &&
    event.shiftKey === !!shortcut.shift &&
    event.altKey === !!shortcut.alt
  );
}
