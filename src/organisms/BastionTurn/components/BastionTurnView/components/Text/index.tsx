'use client';

import styled from 'styled-components';

export const Text = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
