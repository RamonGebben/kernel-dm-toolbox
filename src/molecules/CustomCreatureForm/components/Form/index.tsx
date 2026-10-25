'use client';

import styled from 'styled-components';

/**
 * Layout primitives shared by `CustomCreatureForm` and every field-group
 * sub-component under `components/`. Kept in their own module (not
 * `index.tsx`) so importing them never creates a cycle with the top-level
 * form, which imports each sub-component.
 */

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('base')};
  padding: ${props => props.theme.spacing('base')};
  background: ${props => props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
