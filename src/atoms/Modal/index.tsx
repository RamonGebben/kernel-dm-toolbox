'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import styled from 'styled-components';

export type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * A centred dialog over a scrim.
 *
 * Rendered inline rather than through a portal on purpose: a portal to
 * `document.body` puts the dialog outside the Storybook canvas element, which
 * is exactly the subtree the story tests query. Inline keeps every state
 * reachable from a story.
 *
 * It is not a `<dialog>` element either — `showModal()` is imperative state
 * that would have to be kept in sync with the `isOpen` prop, and the two
 * drifting apart is a whole class of bug this does not need.
 */
export const Modal = ({ title, isOpen, onClose, children }: ModalProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus moves into the dialog so the keyboard is not left behind on the
    // button that opened it.
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Scrim onClick={onClose}>
      <Panel
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
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
  );
};

const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.space.md};
  background: ${props =>
    `color-mix(in srgb, ${props.theme.color.canvas} 60%, transparent)`};
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  width: min(32rem, 100%);
  max-height: min(40rem, 90dvh);
  background: ${props => props.theme.color.surface};
  border: 1px solid ${props => props.theme.color.border};
  border-top: 2px solid ${props => props.theme.color.accent};
  border-radius: ${props => props.theme.radius.md};
  box-shadow: ${props => props.theme.shadow.raised};

  &:focus {
    outline: none;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.md};
  padding: ${props => props.theme.space.md};
  border-bottom: 1px solid ${props => props.theme.color.border};
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const CloseButton = styled.button`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: transparent;
  border: 1px solid transparent;
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textMuted};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color.textPrimary};
    background: ${props => props.theme.color.surfaceRaised};
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${props => props.theme.space.md};
`;
