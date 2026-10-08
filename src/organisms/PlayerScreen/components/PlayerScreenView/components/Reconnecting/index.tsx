'use client';

import styled from 'styled-components';

export const Reconnecting = styled.span`
  position: absolute;
  top: ${props => props.theme.spacing('base')};
  right: ${props => props.theme.spacing('base')};
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: ${props => props.theme.color('formBackground')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
