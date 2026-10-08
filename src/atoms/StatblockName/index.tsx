'use client';

import styled from 'styled-components';

export const StatblockName = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize('l')};
  letter-spacing: 0.02em;
  color: ${props => props.theme.color('primary')};
`;
