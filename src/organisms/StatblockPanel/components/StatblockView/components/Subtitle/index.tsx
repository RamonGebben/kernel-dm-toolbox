'use client';

import styled from 'styled-components';

export const Subtitle = styled.p`
  margin: 0 0 ${props => props.theme.spacing('s')};
  font-style: italic;
  color: ${props => props.theme.color('background', 'text')};
`;
