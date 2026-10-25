'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Portal } from '~/atoms/Portal';
import { Scrim } from '~/atoms/Modal/components/Scrim';
import { Panel } from '~/atoms/Modal/components/Panel';
import { Header } from '~/atoms/Modal/components/Header';
import { Title } from '~/atoms/Modal/components/Title';
import { CloseButton } from '~/atoms/Modal/components/CloseButton';
import { Body } from '~/atoms/Modal/components/Body';

export type ModalSize = 'default' | 'wide';

export interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  /**
   * `wide` roughly doubles the panel's max width. The panel transitions
   * between the two on its own `width`, so a single open modal can widen
   * itself mid-flow (a wizard's later step) instead of needing a second
   * modal instance.
   */
  size?: ModalSize;
  children: ReactNode;
}

/**
 * A centred dialog over a scrim.
 *
 * Rendered through `Portal`, to `document.body` — otherwise it sits wherever
 * its caller mounted it in the DOM, which for `EncounterView`'s initiative
 * dialog and `NewCreatureWizard` is inside a `Panel` whose body scrolls; a
 * `Panel` clips overflow, so an unportalled dialog on a short viewport could
 * be cut off by its own ancestor instead of scrolling into view. Its stories
 * query the portalled content via `screen`, not `within(canvasElement)`.
 *
 * It is not a `<dialog>` element either — `showModal()` is imperative state
 * that would have to be kept in sync with the `isOpen` prop, and the two
 * drifting apart is a whole class of bug this does not need.
 */
export const Modal = ({
  title,
  isOpen,
  onClose,
  size = 'default',
  children,
}: ModalProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Deliberately its own effect, keyed only on `isOpen`: focus should move
  // into the dialog once, on open, not every time `onClose` is re-created by
  // the caller's render — that used to steal focus back from any input
  // inside the dialog on every keystroke.
  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <Scrim onClick={onClose}>
        <Panel
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          $isWide={size === 'wide'}
          onClick={event => event.stopPropagation()}
        >
          <Header>
            <Title id={titleId}>{title}</Title>
            <CloseButton type="button" onClick={onClose} aria-label="Close">
              ✕
            </CloseButton>
          </Header>
          <Body>{children}</Body>
        </Panel>
      </Scrim>
    </Portal>
  );
};
