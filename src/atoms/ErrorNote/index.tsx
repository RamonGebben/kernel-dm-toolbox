'use client';

import styled from 'styled-components';

/** A small paragraph in the error colour: why something failed. */
export const ErrorNote = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('error')};
`;
