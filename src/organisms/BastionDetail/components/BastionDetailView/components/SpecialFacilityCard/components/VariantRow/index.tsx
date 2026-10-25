'use client';

import styled from 'styled-components';

export const VariantRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
