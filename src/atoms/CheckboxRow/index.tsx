'use client';

import styled from 'styled-components';

/** The label-beside-checkbox layout every map-control panel's toggles share. */
export const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};

  label {
    color: ${props => props.theme.color('background', 'text')};
    font-size: ${props => props.theme.fontSize('s')};
  }
`;
