'use client';

import styled from 'styled-components';

export const Table = styled.table`
  width: 100%;
  margin: 0 0 ${props => props.theme.spacing('xs')};
  border-collapse: collapse;
  font-size: ${props => props.theme.fontSize('s')};

  &:last-child {
    margin-bottom: 0;
  }
`;
