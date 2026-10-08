'use client';

import styled from 'styled-components';

export const List = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
`;
