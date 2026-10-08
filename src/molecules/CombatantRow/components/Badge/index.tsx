'use client';

import styled from 'styled-components';

export const Badge = styled.span<{ $tone: 'active' | 'muted' }>`
  flex-shrink: 0;
  padding: 0 ${props => props.theme.spacing('xs')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$tone === 'active'
        ? props.theme.color('primary')
        : props.theme.color('secondary')};
  border-radius: ${props => props.theme.borderRadius('full')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props =>
    props.$tone === 'active'
      ? props.theme.color('primary')
      : props.theme.color('formBackground', 'text')};
`;
