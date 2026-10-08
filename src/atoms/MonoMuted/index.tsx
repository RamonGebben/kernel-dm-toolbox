'use client';

import styled from 'styled-components';

/** A muted figure in the monospace face. */
export const MonoMuted = styled.span`
  font-family: ${props => props.theme.fontFamily('mono')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
