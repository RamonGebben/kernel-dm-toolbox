'use client';

import styled from 'styled-components';

export const NameRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('s')};
`;
