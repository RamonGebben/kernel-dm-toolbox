'use client';

import styled from 'styled-components';

export const EventName = styled.p`
  margin: 0;
  font-weight: ${props => props.theme.fontWeight('semibold')};
  font-size: ${props => props.theme.fontSize('m')};
  color: ${props => props.theme.color('primary')};
`;
