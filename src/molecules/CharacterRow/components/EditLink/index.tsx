'use client';

import styled from 'styled-components';
import Link from 'next/link';

/** Styled like a ghost `Button`, but a real link: it navigates to /party. */
export const EditLink = styled(Link)`
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  border-radius: ${props => props.theme.borderRadius('s')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
  text-decoration: none;

  &:hover {
    color: ${props => props.theme.color('background', 'text')};
    background: ${props => props.theme.color('background', 'emphasis')};
  }
`;
