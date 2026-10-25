'use client';

import styled from 'styled-components';

export const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: ${props => props.theme.spacing('s')};
`;
