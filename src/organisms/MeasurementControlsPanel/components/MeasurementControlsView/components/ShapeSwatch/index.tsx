'use client';

import styled from 'styled-components';

/** The colour is an inline style: it tracks a colour picker being dragged. */
export const ShapeSwatch = styled.span.attrs<{ $color: string }>(props => ({
  style: { background: props.$color },
}))`
  width: 0.75rem;
  height: 0.75rem;
  flex: none;
  border-radius: ${props => props.theme.borderRadius('s')};
`;
