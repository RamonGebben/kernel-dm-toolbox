'use client';

import { useEffect, useRef, type RefObject } from 'react';

export type DismissableMenuRefs = {
  /** The trigger, still rendered inline where the caller mounted it. */
  triggerRef: RefObject<HTMLDivElement | null>;
  /** The floating content itself, rendered through `Portal` — a different
   * DOM subtree than the trigger, so containment has to be tested against
   * both refs rather than one shared wrapper. */
  menuRef: RefObject<HTMLDivElement | null>;
};

/**
 * Click-outside-or-Escape-to-close wiring shared by any open popover whose
 * content is portalled away from its trigger (`MapRowMenu`,
 * `MultiSelectFilter`) — a pointerdown only counts as "outside" once it
 * misses both the trigger and the portalled menu. Only attaches its
 * listeners while `isOpen`, so a closed menu costs nothing.
 */
export const useDismissableMenu = (
  isOpen: boolean,
  onClose: () => void,
): DismissableMenuRefs => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onCloseRef.current();
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

  return { triggerRef, menuRef };
};
