'use client';

import styled from 'styled-components';

export const Total = styled.span`
  font-size: ${props => props.theme.fontSize('m')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
  color: ${props => props.theme.color('primary')};
`;
