'use client';

import styled from 'styled-components';

export const Name = styled.p`
  margin: 0;
  min-width: 0;
  color: ${props => props.theme.color('background', 'text')};
`;
