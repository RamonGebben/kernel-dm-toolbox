'use client';

import styled from 'styled-components';

export const List = styled.ul`
  margin: 0 0 ${props => props.theme.spacing('xs')};
  padding-left: ${props => props.theme.spacing('m')};

  &:last-child {
    margin-bottom: 0;
  }
`;
