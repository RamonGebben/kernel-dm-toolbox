'use client';

import styled from 'styled-components';

export const Rail = styled.nav`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.spacing('base')}
    ${props => props.theme.spacing('s')};
  background: ${props => props.theme.color('background', 'emphasis')};
  border-right: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
`;
