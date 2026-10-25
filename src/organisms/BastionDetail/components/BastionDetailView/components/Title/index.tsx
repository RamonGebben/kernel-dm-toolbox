'use client';

import styled from 'styled-components';

export const Title = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.fontSize('l')};
  color: ${props => props.theme.color('background', 'text')};
`;
