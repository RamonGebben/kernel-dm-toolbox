'use client';

import styled from 'styled-components';

export const StatblockLine = styled.p`
  margin: 0 0 ${props => props.theme.spacing('xs')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
