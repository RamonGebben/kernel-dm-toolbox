'use client';

import styled from 'styled-components';

export const Result = styled.p`
  margin: 0;
  font-weight: ${props => props.theme.fontWeight('semibold')};
  color: ${props => props.theme.color('primary')};
`;
