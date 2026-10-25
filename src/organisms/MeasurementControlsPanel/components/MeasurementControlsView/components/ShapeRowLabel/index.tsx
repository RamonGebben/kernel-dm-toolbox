'use client';

import styled from 'styled-components';

export const ShapeRowLabel = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  color: ${props => props.theme.color('background', 'text')};
  font-size: ${props => props.theme.fontSize('s')};
`;
