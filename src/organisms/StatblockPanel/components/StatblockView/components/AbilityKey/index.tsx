'use client';

import styled from 'styled-components';

export const AbilityKey = styled.dt`
  font-weight: ${props => props.theme.fontWeight('bold')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('primary')};
`;
