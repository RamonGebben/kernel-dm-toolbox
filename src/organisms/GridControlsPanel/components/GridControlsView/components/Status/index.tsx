'use client';

import styled from 'styled-components';

export const Status = styled.p`
  margin: 0;
  font-family: ${props => props.theme.fontFamily('mono')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
