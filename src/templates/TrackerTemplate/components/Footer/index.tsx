'use client';

import styled from 'styled-components';

export const Footer = styled.footer`
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing('base')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
