'use client';

import styled from 'styled-components';

export const MemberName = styled.legend`
  padding: 0;
  font-weight: ${props => props.theme.fontWeight('semibold')};
  color: ${props => props.theme.color('background', 'text')};
`;
