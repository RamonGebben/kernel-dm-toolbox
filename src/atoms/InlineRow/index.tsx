'use client';

import styled from 'styled-components';

/** A row of vertically centred children. */
export const InlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
`;
