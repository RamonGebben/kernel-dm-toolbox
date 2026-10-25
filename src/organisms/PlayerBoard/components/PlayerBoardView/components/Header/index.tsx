'use client';

import styled from 'styled-components';

export const Header = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('base')};
`;
