'use client';

import styled from 'styled-components';

/** A small, muted figure in the monospace face that never shrinks. */
export const MonoCaption = styled.span`
  flex-shrink: 0;
  font-family: ${props => props.theme.fontFamily('mono')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
