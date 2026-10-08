'use client';

import styled from 'styled-components';

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
`;
