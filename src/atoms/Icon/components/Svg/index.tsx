'use client';

import styled from 'styled-components';

export const Svg = styled.svg<{ $size: string }>`
  width: ${props => props.$size};
  height: ${props => props.$size};
  flex-shrink: 0;
`;
