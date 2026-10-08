'use client';

import styled from 'styled-components';

export const OptionLabel = styled.span`
  font-weight: ${props => props.theme.fontWeight('semibold')};
  color: ${props => props.theme.color('background', 'text')};
`;
