'use client';

import styled from 'styled-components';

/** A paragraph in the primary text colour, with no margin of its own. */
export const Paragraph = styled.p`
  margin: 0;
  color: ${props => props.theme.color('background', 'text')};
`;
