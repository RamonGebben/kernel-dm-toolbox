'use client';

import styled from 'styled-components';

export const Round = styled.span`
  font-size: ${props => props.theme.fontSize('s')};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
