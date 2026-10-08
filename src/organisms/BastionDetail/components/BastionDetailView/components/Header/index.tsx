'use client';

import styled from 'styled-components';

export const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('s')};
`;
