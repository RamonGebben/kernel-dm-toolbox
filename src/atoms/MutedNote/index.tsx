'use client';

import styled from 'styled-components';

/** A small, muted paragraph: a hint, a summary, an aside. */
export const MutedNote = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
