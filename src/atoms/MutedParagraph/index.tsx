'use client';

import styled from 'styled-components';

/** A paragraph in the muted colour, at the surrounding size. */
export const MutedParagraph = styled.p`
  margin: 0;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
