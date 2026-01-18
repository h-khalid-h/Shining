import { memo, type JSXElementConstructor, type ComponentProps } from 'react';

export const genericMemo: <T extends JSXElementConstructor<any>>(
  component: T,
  propsAreEqual?: (prevProps: ComponentProps<T>, nextProps: ComponentProps<T>) => boolean,
) => T & { displayName?: string } = memo;
