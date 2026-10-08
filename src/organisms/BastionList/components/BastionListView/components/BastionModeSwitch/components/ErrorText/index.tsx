'use client';

import styled from 'styled-components';

export const ErrorText = styled.p`
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('error')};
`;
