'use client';

import styled from 'styled-components';

export const Benefits = styled.ul`
  margin: 0;
  padding-left: ${props => props.theme.spacing('base')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
