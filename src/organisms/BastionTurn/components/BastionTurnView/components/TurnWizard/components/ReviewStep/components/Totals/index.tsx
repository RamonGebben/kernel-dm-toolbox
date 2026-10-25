'use client';

import styled from 'styled-components';

export const Totals = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  font-family: ${props => props.theme.fontFamily('mono')};
  font-size: ${props => props.theme.fontSize('s')};
`;
