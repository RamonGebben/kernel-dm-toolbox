'use client';

import styled from 'styled-components';

export const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  margin: 0;
  padding: 0;
  list-style: none;
`;
