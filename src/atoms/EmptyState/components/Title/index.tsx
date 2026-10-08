'use client';

import styled from 'styled-components';

export const Title = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize('m')};
  color: ${props => props.theme.color('background', 'text')};
`;
