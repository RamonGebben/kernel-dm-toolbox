'use client';

import styled from 'styled-components';

export const Name = styled.h3`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  margin: 0;
  font-size: ${props => props.theme.fontSize('m')};
  color: ${props => props.theme.color('background', 'text')};
`;
