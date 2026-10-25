'use client';

import styled from 'styled-components';

export const StatblockEntryName = styled.strong`
  font-style: italic;
  color: ${props => props.theme.color('background', 'text')};
`;
