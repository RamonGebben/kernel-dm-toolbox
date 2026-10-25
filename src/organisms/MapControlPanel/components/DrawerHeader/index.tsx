'use client';

import styled from 'styled-components';

export const DrawerHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('base')};
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
  border-bottom: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
`;
