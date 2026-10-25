'use client';

import styled from 'styled-components';

export const Label = styled.span`
  min-width: 9rem;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
