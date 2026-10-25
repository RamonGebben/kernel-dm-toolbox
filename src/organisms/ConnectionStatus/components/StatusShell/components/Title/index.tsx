'use client';

import styled from 'styled-components';

export const Title = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
