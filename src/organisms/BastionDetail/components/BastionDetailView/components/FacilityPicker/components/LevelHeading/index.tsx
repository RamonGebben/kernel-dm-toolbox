'use client';

import styled from 'styled-components';

export const LevelHeading = styled.h4`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
