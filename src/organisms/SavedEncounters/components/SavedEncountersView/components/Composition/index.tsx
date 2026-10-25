'use client';

import styled from 'styled-components';

export const Composition = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
