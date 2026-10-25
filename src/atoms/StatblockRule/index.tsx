'use client';

import styled from 'styled-components';

export const StatblockRule = styled.hr`
  margin: ${props => props.theme.spacing('s')} 0;
  border: none;
  border-top: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('secondary')};
`;
