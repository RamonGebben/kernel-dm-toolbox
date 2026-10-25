'use client';

import styled from 'styled-components';

export const Round = styled.h1`
  margin: 0;
  font-size: ${props => props.theme.fontSize('xl')};
  letter-spacing: 0.04em;
  color: ${props => props.theme.color('primary')};
`;
