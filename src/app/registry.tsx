'use client';

import { useState, type ReactNode } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';
import { shouldForwardProp } from '~/theme/shouldForwardProp';

type StyledComponentsRegistryProps = {
  children: ReactNode;
};

/**
 * Collects the CSS rules styled-components generates during a server render and
 * flushes them into `<head>` before any markup that depends on them. Required:
 * styled-components cannot be used from a Server Component without it.
 *
 * See `node_modules/next/dist/docs/01-app/02-guides/css-in-js.md`.
 */
export const StyledComponentsRegistry = ({
  children,
}: StyledComponentsRegistryProps) => {
  // Lazy initial state so the sheet is created exactly once per render pass.
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager
      sheet={styledComponentsStyleSheet.instance}
      shouldForwardProp={shouldForwardProp}
    >
      {children}
    </StyleSheetManager>
  );
};
