'use client';

import styled, { type DefaultTheme } from 'styled-components';

const stepColors = {
  current: (theme: DefaultTheme) => theme.color('primary'),
  done: (theme: DefaultTheme) => theme.color('background', 'text'),
  todo: (theme: DefaultTheme) => theme.color('formBackground', 'text'),
} as const;

export const Step = styled.li<{ $state: keyof typeof stepColors }>`
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$state === 'current'
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => stepColors[props.$state](props.theme)};
`;
