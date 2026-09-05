'use client';

import { useEffect, useId, type ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

export type SidePanelProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * A panel that slides in from the right edge, for reference material read
 * alongside a list — the spell lookup pane is the first user. Unlike `Modal`
 * there is no scrim: the list behind it stays visible and clickable, so
 * picking a different item while the pane is open just swaps its contents.
 */
export const SidePanel = ({
  title,
  isOpen,
  onClose,
  children,
}: SidePanelProps) => {
  const titleId = useId();

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
    <Aside aria-labelledby={titleId}>
      <Header>
        <Title id={titleId}>{title}</Title>
        <CloseButton type="button" onClick={onClose} aria-label="Close">
          ✕
        </CloseButton>
      </Header>
      <Body>{children}</Body>
    </Aside>
  );
};

const slideIn = keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`;

const Aside = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  width: min(28rem, 100%);
  height: 100dvh;
  background: ${props => props.theme.color.surface};
  border-left: 1px solid ${props => props.theme.color.border};
  border-top: 2px solid ${props => props.theme.color.accent};
  box-shadow: ${props => props.theme.shadow.raised};
  animation: ${slideIn} 200ms ease-out;
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
