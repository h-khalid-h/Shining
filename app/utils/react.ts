import { memo, type JSXElementConstructor, type ComponentProps } from 'react';
import type { IntrinsicElements } from 'react/jsx-runtime';

export const genericMemo: <T extends keyof IntrinsicElements | JSXElementConstructor<any>>(
  component: T,
  propsAreEqual?: (prevProps: ComponentProps<T>, nextProps: ComponentProps<T>) => boolean,
) => T & { displayName?: string } = memo;
