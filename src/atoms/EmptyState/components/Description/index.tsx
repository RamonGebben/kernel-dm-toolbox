'use client';

import styled from 'styled-components';

export const Description = styled.p`
  margin: 0;
  max-width: 32ch;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
