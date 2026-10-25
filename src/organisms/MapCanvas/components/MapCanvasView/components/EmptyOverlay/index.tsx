'use client';

import styled from 'styled-components';

export const EmptyOverlay = styled.p`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: ${props => props.theme.spacing('base')};
  text-align: center;
  color: ${props => props.theme.color('formBackground', 'text')};
  font-size: ${props => props.theme.fontSize('s')};
  pointer-events: none;
`;
