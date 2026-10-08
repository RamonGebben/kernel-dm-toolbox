'use client';

import styled from 'styled-components';

export const StyledAnchor = styled.a`
  font-weight: ${props => props.theme.fontWeight('semibold')};
  color: ${props => props.theme.color('primary')};
`;
