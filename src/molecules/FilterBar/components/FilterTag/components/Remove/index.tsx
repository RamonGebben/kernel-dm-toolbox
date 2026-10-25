'use client';

import styled from 'styled-components';

export const Remove = styled.button`
  padding: 0 ${props => props.theme.spacing('s')};
  background: transparent;
  border: none;
  border-radius: 0 ${props => props.theme.borderRadius('full')}
    ${props => props.theme.borderRadius('full')} 0;
  color: ${props => props.theme.color('formBackground', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('base')};
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color('primary')};
  }
`;
