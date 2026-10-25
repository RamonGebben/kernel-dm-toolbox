'use client';

import styled from 'styled-components';

/** An unstyled vertical list: no bullets, no indent. */
export const PlainList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
`;
