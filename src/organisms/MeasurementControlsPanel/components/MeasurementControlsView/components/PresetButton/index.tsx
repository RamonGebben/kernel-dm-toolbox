'use client';

import styled from 'styled-components';

export const PresetButton = styled.button<{ $isActive: boolean }>`
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isActive
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  background: ${props =>
    props.$isActive
      ? props.theme.color('secondary')
      : props.theme.color('background')};
  color: ${props => props.theme.color('background', 'text')};
  font-size: ${props => props.theme.fontSize('s')};
  cursor: pointer;
`;
