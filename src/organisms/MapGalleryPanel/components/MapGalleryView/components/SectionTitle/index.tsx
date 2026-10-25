'use client';

import styled from 'styled-components';

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
