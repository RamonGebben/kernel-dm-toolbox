'use client';

import styled from 'styled-components';

export const Name = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize('l')};
  color: ${props => props.theme.color('primary')};
`;
