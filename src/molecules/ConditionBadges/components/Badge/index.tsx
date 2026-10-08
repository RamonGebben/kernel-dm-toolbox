'use client';

import styled from 'styled-components';

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing('xs')};
  padding: 0 ${props => props.theme.spacing('xs')};
  background: ${props => props.theme.color('secondary')};
  border-radius: ${props => props.theme.borderRadius('full')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
