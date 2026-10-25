'use client';

import styled from 'styled-components';

export const Tag = styled.span<{ $isEditing: boolean; $isDisabled: boolean }>`
  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
  background: ${props => props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isEditing
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('full')};
  font-size: ${props => props.theme.fontSize('s')};
  opacity: ${props => (props.$isDisabled ? 0.5 : 1)};

  &:hover {
    border-color: ${props => props.theme.color('primary')};
  }
`;
