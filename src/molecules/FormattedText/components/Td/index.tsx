'use client';

import styled from 'styled-components';

export const Td = styled.td`
  padding: ${props => props.theme.spacing('xs')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  vertical-align: top;
`;
