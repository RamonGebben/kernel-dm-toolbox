'use client';

import styled from 'styled-components';

export const Ruleset = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
