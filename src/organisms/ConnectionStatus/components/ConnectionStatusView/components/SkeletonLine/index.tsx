'use client';

import styled from 'styled-components';

export const SkeletonLine = styled.div<{ $isShort?: boolean }>`
  height: 1rem;
  width: ${props => (props.$isShort ? '40%' : '70%')};
  border-radius: ${props => props.theme.borderRadius('s')};
  background: ${props => props.theme.color('formBackground')};
`;
