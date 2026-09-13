'use client';

import styled from 'styled-components';

/**
 * The label-above-input layout every map-control panel's plain fields
 * share (a number/color/range input, a `Select`) — muted label, `xs` gap.
 */
export const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};

  label {
    font-size: ${props => props.theme.fontSize.sm};
    color: ${props => props.theme.color.textMuted};
  }
`;

/** The label-beside-checkbox layout every map-control panel's toggles share. */
export const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};

  label {
    color: ${props => props.theme.color.textPrimary};
    font-size: ${props => props.theme.fontSize.sm};
  }
`;

/** A themed `<select>`, styled the same everywhere one appears in a control panel. */
export const Select = styled.select`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
`;
