'use client';

import styled from 'styled-components';

export const RailDivider = styled.hr`
  width: 100%;
  margin: ${props => props.theme.spacing('xs')} 0;
  border: none;
  border-top: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
`;
