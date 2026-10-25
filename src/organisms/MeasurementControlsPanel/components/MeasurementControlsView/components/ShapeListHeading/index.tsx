'use client';

import styled from 'styled-components';

export const ShapeListHeading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  letter-spacing: 0.04em;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
