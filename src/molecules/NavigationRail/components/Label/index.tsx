'use client';

import styled from 'styled-components';

export const Label = styled.span`
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
  letter-spacing: 0.02em;
`;
