'use client';

import styled from 'styled-components';

export const ErrorBanner = styled.p`
  margin: 0;
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('error')};
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props => props.theme.color('error')};
`;
