'use client';

import styled from 'styled-components';

/** A shell command shown inline, in the monospace face. */
export const Command = styled.code`
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  background: ${props => props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  font-family: ${props => props.theme.fontFamily('mono')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('primary')};
`;
