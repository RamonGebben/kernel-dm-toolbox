'use client';

import styled from 'styled-components';

export const Orders = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${props => props.theme.fontSize('s')};
`;
