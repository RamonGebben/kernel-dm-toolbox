'use client';

import styled from 'styled-components';

export const CloseButton = styled.button`
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: none;
  border-radius: ${props => props.theme.borderRadius('s')};
  background: transparent;
  color: ${props => props.theme.color('formBackground', 'text')};
  cursor: pointer;
  font-size: ${props => props.theme.fontSize('s')};

  &:hover {
    color: ${props => props.theme.color('background', 'text')};
    background: ${props => props.theme.color('formBackground')};
  }
`;
