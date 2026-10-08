'use client';

import styled from 'styled-components';
import Link from 'next/link';

export const ManageLink = styled(Link)`
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
  color: ${props => props.theme.color('primary')};
`;
