'use client';

import styled from 'styled-components';

export const Heading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
