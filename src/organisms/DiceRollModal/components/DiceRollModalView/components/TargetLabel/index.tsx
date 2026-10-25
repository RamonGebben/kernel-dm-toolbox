'use client';

import styled from 'styled-components';

export const TargetLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('xs')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
