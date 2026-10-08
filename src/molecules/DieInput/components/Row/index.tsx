'use client';

import styled from 'styled-components';

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
