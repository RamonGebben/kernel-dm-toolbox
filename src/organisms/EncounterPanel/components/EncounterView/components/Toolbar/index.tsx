'use client';

import styled from 'styled-components';

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('base')};
  flex-wrap: wrap;
`;
