'use client';

import styled from 'styled-components';

export const Name = styled.label`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.spacing('s')};
  color: ${props => props.theme.color('background', 'text')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
`;
