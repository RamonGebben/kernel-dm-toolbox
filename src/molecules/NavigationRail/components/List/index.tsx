'use client';

import styled from 'styled-components';

export const List = styled.ul`
  display: flex;
  flex-direction: row;
  gap: ${props => props.theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;

  /* A rail on a laptop, a strip across the top of a tablet. */
  @media (min-width: ${props => props.theme.bp('tabletLandscape')}) {
    flex-direction: column;
  }
`;
