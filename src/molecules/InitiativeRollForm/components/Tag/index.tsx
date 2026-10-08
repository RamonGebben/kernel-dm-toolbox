'use client';

import styled from 'styled-components';

export const Tag = styled.span`
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('regular')};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.color('primary')};
`;
