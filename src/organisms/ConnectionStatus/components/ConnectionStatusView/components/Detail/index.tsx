'use client';

import styled from 'styled-components';

export const Detail = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
  font-family: ${props => props.theme.fontFamily('mono')};
`;
