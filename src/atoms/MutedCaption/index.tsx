'use client';

import styled from 'styled-components';

/** A small, muted inline label. */
export const MutedCaption = styled.span`
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
