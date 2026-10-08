'use client';

import styled from 'styled-components';

export const Item = styled.button<{ $isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
  text-align: left;
  background: ${props =>
    props.$isSelected
      ? props.theme.color('formBackground')
      : props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isSelected
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  color: inherit;
  font: inherit;
  cursor: pointer;
`;
