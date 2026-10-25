'use client';

import styled from 'styled-components';

/**
 * The label-above-input layout every map-control panel's plain fields
 * share (a number/color/range input, a `Select`) — muted label, `xs` gap.
 */
export const FieldRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};

  label {
    font-size: ${props => props.theme.fontSize('s')};
    color: ${props => props.theme.color('formBackground', 'text')};
  }
`;
