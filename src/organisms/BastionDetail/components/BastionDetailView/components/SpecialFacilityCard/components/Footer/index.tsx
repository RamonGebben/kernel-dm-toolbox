'use client';

import styled from 'styled-components';

export const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('s')};
`;
