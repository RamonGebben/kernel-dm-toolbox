'use client';

import styled from 'styled-components';

/** Inline text in the muted colour, at the surrounding size. */
export const MutedInline = styled.span`
  color: ${props => props.theme.color('formBackground', 'text')};
`;
