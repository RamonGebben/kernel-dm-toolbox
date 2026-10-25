'use client';

import styled from 'styled-components';

export const CardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('s')};
`;
