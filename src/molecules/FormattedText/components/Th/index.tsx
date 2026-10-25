'use client';

import styled from 'styled-components';

export const Th = styled.th`
  padding: ${props => props.theme.spacing('xs')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  color: ${props => props.theme.color('primary')};
  text-align: left;
`;
