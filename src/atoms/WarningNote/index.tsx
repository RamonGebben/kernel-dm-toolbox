'use client';

import styled from 'styled-components';

/** A small paragraph in the warning colour: why something is blocked. */
export const WarningNote = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('quaternary')};
`;
