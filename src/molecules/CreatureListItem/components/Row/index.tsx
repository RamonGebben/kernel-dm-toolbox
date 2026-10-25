'use client';

import styled from 'styled-components';

export const Row = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  width: 100%;
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
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
  color: ${props => props.theme.color('background', 'text')};
  font-size: ${props => props.theme.fontSize('base')};

  &:hover {
    border-color: ${props => props.theme.color('primary')};
  }
`;
