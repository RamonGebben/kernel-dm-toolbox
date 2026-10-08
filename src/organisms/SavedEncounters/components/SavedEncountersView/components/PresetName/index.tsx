'use client';

import styled from 'styled-components';

export const PresetName = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize('base')};
  color: ${props => props.theme.color('background', 'text')};
`;
