'use client';

import styled from 'styled-components';

export const Notes = styled.p`
  margin: 0;
  white-space: pre-line;
  color: ${props => props.theme.color('background', 'text')};
`;
