'use client';

import styled from 'styled-components';

/** A placeholder block shown while content is pending. */
export const Skeleton = styled.div.attrs({ role: 'status' })<{
  $height: string;
}>`
  height: ${props => props.$height};
  border-radius: ${props => props.theme.borderRadius('s')};
  background: ${props => props.theme.color('formBackground')};
`;
