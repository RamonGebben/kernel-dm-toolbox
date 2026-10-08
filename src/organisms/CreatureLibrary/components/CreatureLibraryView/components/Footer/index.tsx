'use client';

import styled from 'styled-components';

export const Footer = styled.div`
  padding-top: ${props => props.theme.spacing('s')};
  border-top: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
`;
