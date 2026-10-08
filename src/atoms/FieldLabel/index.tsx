'use client';

import styled from 'styled-components';

/** A small, muted label for a form field. */
export const FieldLabel = styled.label`
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
