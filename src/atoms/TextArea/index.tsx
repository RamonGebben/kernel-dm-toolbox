'use client';

import styled from 'styled-components';

/** A themed `<textarea>` that resizes vertically. */
export const TextArea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.spacing('s')};
  background: ${props => props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props => props.theme.color('background', 'text')};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize('base')};
  resize: vertical;
`;
