'use client';

import styled from 'styled-components';

export const Heading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize('m')};
  color: ${props => props.theme.color('background', 'text')};
`;
