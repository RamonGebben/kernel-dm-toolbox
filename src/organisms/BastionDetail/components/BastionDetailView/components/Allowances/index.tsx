'use client';

import styled from 'styled-components';

export const Allowances = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('base')};
  margin: ${props => props.theme.spacing('xs')} 0 0;
  padding: 0;
  list-style: none;
  font-family: ${props => props.theme.fontFamily('mono')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
