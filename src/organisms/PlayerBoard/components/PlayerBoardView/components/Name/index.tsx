'use client';

import styled from 'styled-components';

export const Name = styled.span<{ $isPlayerCharacter: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${props => (props.$isPlayerCharacter ? 700 : 400)};
  color: ${props => props.theme.color('background', 'text')};
`;
