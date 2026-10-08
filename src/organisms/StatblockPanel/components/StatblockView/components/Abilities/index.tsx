'use client';

import styled from 'styled-components';

export const Abilities = styled.dl`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${props => props.theme.spacing('xs')};
  margin: 0;
  text-align: center;
`;
