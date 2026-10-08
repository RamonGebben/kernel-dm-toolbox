'use client';

import styled from 'styled-components';

export const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  margin-top: ${props => props.theme.spacing('base')};
  padding-top: ${props => props.theme.spacing('base')};
  border-top: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
`;
