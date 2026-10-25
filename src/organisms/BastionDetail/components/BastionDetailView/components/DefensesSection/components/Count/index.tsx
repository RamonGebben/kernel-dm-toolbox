'use client';

import styled from 'styled-components';

export const Count = styled.span`
  min-width: 2ch;
  text-align: center;
  font-family: ${props => props.theme.fontFamily('mono')};
`;
