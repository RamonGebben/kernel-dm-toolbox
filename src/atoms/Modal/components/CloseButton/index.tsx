'use client';

import styled from 'styled-components';

export const CloseButton = styled.button`
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: transparent;
  border: ${props => props.theme.borderWidth('s')} solid transparent;
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('base')};
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color('background', 'text')};
    background: ${props => props.theme.color('formBackground')};
  }
`;
