'use client';

import styled from 'styled-components';

export const List = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: ${props => props.theme.spacing('s')};
  margin: 0;
  padding: 0;
  list-style: none;
`;
