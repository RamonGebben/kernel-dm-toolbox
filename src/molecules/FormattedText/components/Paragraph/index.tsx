'use client';

import styled from 'styled-components';

export const Paragraph = styled.p`
  margin: 0 0 ${props => props.theme.spacing('xs')};

  &:last-child {
    margin-bottom: 0;
  }
`;
