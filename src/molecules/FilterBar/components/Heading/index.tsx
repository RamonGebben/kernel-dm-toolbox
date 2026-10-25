'use client';

import styled from 'styled-components';

export const Heading = styled.h3`
  margin: 0 0 ${props => props.theme.spacing('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('semibold')};
`;
