'use client';

import styled, { css } from 'styled-components';

export const Chevron = styled.span<{ $isExpanded: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  transition: transform 120ms ease;
  ${props =>
    !props.$isExpanded &&
    css`
      transform: rotate(-90deg);
    `}
`;
