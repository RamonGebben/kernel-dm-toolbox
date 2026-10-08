'use client';

import styled from 'styled-components';

export const Stats = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('base')};
  margin: 0;
`;
