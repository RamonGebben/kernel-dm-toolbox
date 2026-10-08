'use client';

import styled from 'styled-components';

export const Initiative = styled.span`
  font-family: ${props => props.theme.fontFamily('mono')};
  font-weight: ${props => props.theme.fontWeight('bold')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
