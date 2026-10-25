'use client';

import styled from 'styled-components';

export const SpellOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  background: ${props => props.theme.color('background')};
  color: ${props => props.theme.color('background', 'text')};
  font-size: ${props => props.theme.fontSize('s')};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.color('formBackground')};
  }
`;
