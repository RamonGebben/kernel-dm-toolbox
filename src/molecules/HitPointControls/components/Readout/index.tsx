'use client';

import styled from 'styled-components';

export const Readout = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.spacing('s')};
`;
