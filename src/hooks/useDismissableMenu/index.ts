'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Click-outside-or-Escape-to-close wiring shared by any open popover that
 * isn't rendered through a portal (`MapRowMenu`, `MultiSelectFilter`) — the
 * wrapper ref returned here is what the pointer-down check tests against.
 * Only attaches its listeners while `isOpen`, so a closed menu costs nothing.
 */
export const useDismissableMenu = (
  isOpen: boolean,
  onClose: () => void,
): RefObject<HTMLDivElement | null> => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        onCloseRef.current();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return wrapperRef;
};
