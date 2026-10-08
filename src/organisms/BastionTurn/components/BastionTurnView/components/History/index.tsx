'use client';

import styled from 'styled-components';

export const History = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('base')};
  margin: 0;
  padding: 0;
  list-style: none;
  color: ${props => props.theme.color('background', 'text')};

  ul {
    margin: ${props => props.theme.spacing('xs')} 0 0;
    padding-left: ${props => props.theme.spacing('base')};
  }
`;
