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
  gap: ${props => props.theme.space.md};
  padding: ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

export const Grid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${props => props.$columns ?? 4},
    minmax(0, 1fr)
  );
  gap: ${props => props.theme.space.sm};
`;

export const Label = styled.label`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;

export const Select = styled.select`
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
`;
