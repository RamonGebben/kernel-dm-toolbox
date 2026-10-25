'use client';

import styled from 'styled-components';

export const Warning = styled.p`
  flex-basis: 100%;
  margin: 0;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
