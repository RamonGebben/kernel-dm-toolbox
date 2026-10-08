'use client';

import styled from 'styled-components';

export const MenuLabel = styled.p`
  margin: 0;
  padding: 0 ${props => props.theme.spacing('s')};
  font-size: ${props => props.theme.fontSize('s')};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
