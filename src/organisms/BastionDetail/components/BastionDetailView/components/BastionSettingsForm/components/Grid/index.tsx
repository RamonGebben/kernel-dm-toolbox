'use client';

import styled from 'styled-components';

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${props => props.theme.spacing('s')};
`;
